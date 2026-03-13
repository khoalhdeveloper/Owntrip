import { Request, Response } from "express";
import axios from "axios";

const RAPID_API_BASE_URL = "https://google-map-places-new-v2.p.rapidapi.com/v1";

const getRapidHeaders = () => ({
  "Content-Type": "application/json",
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
  "X-RapidAPI-Host": process.env.RAPIDAPI_HOST!
});

const isQuotaExceededError = (error: any) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || error?.message || "").toLowerCase();
  return status === 429 || message.includes("daily quota") || message.includes("quota");
};

const buildPhotoProxyUrl = (req: Request, photoName: string, maxHeightPx = 400) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/api/places/photo?name=${encodeURIComponent(photoName)}&maxHeightPx=${maxHeightPx}`;
};

export const getPlacePhoto = async (req: Request, res: Response) => {
  try {
    const { name, maxHeightPx } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Missing photo name"
      });
    }

    const mediaResponse = await axios.get(
      `${RAPID_API_BASE_URL}/${name}/media`,
      {
        headers: getRapidHeaders(),
        params: {
          maxHeightPx: maxHeightPx ? Number(maxHeightPx) : 400
        },
        responseType: "arraybuffer"
      }
    );

    const contentType = mediaResponse.headers["content-type"] || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    return res.status(200).send(Buffer.from(mediaResponse.data));
  } catch (error: any) {
    console.error(error.response?.data || error.message);

    if (isQuotaExceededError(error)) {
      return res.status(429).json({
        success: false,
        message: "RapidAPI đã hết quota trong ngày. Vui lòng thử lại ngày mai hoặc nâng gói."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Get place photo failed"
    });
  }
};

export const searchPlace = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    const response = await axios.post(
      "https://google-map-places-new-v2.p.rapidapi.com/v1/places:autocomplete",
      {
        input: q,
        languageCode: "vi",
        regionCode: "VN",
        includeQueryPredictions: true
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.photos",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST!
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Search place failed"
    });
  }
};

export const searchNearby = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius, type } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tọa độ (lat, lng)"
      });
    }

    const includedTypes = type ? (type as string).split(",") : ["lodging", "tourist_attraction"];

    const response = await axios.post(
      "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchNearby",
      {
        languageCode: "vi",
        regionCode: "VN",
        includedTypes: includedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: parseFloat(lat as string),
              longitude: parseFloat(lng as string)
            },
            radius: radius ? parseFloat(radius as string) : 10000
          }
        },
        rankPreference: 0
      },
      {
        headers: {
          "Content-Type": "application/json",
           "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.photos",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST!
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Search nearby failed"
    });
  }
};

export const searchText = async (req: Request, res: Response) => {
  try {

    const { q, lat, lng, radius, type, limit, photoLimit, includePhotoFallback } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Missing query"
      });
    }

    const parsedLimit = Number(limit);
    const maxResultCount = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 50)
      : 20;

    const parsedPhotoLimit = Number(photoLimit);
    const maxPhotoCount = Number.isFinite(parsedPhotoLimit)
      ? Math.min(Math.max(Math.floor(parsedPhotoLimit), 1), 10)
      : 5;
    const shouldFetchPhotoDetails = String(includePhotoFallback || "false") === "true";

    const queryList = (Array.isArray(q) ? q : [q])
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (!queryList.length) {
      return res.status(400).json({
        success: false,
        message: "Missing query"
      });
    }

    const requestBodyBase: any = {
      languageCode: "vi",
      regionCode: "VN",
      maxResultCount
    };

    if (lat && lng) {
      requestBodyBase.locationBias = {
        circle: {
          center: {
            latitude: parseFloat(lat as string),
            longitude: parseFloat(lng as string)
          },
          radius: radius ? parseFloat(radius as string) : 10000
        }
      };
    }

    if (type) {
      requestBodyBase.includedType = type;
    }

    const rapidHeaders = getRapidHeaders();

    const searchResults = await Promise.allSettled(
      queryList.map((queryText) =>
        axios.post(
          "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText",
          {
            ...requestBodyBase,
            textQuery: queryText
          },
          {
            headers: {
              ...rapidHeaders,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.photos",
            }
          }
        )
      )
    );

    const successfulResponses = searchResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value);

    const failedResponses = searchResults
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason);

    if (!successfulResponses.length) {
      const hasQuotaError = failedResponses.some((err: any) => isQuotaExceededError(err));

      if (hasQuotaError) {
        return res.status(429).json({
          success: false,
          message: "RapidAPI đã hết quota trong ngày. Vui lòng thử lại ngày mai hoặc nâng gói.",
          queryCount: queryList.length,
          total: 0,
          places: []
        });
      }

      return res.status(500).json({
        success: false,
        message: "Search text failed"
      });
    }

    const rawPlaces = successfulResponses.flatMap((response) => response.data.places || []);

    const uniqueRawPlaces = Array.from(
      new Map(rawPlaces.map((place: any) => [place.id, place])).values()
    ).slice(0, maxResultCount);

    const places = await Promise.all(
      uniqueRawPlaces.map(async (p: any) => {
        let photoNames = (p.photos || [])
          .slice(0, maxPhotoCount)
          .map((photo: any) => photo.name)
          .filter((name: string) => Boolean(name));

        if (!photoNames.length && p.id && shouldFetchPhotoDetails) {
          try {
            const detailResponse = await axios.get(
              `${RAPID_API_BASE_URL}/places/${p.id}`,
              {
                headers: {
                  ...rapidHeaders,
                  "X-Goog-FieldMask": "id,photos"
                }
              }
            );

            photoNames = (detailResponse.data.photos || [])
              .slice(0, maxPhotoCount)
              .map((photo: any) => photo.name)
              .filter((name: string) => Boolean(name));
          } catch (photoError: any) {
            if (!isQuotaExceededError(photoError)) {
              console.error(`Get photos failed for place ${p.id}:`, photoError.response?.data || photoError.message);
            }
          }
        }

        const photos = photoNames.map(
          (photoName: string) => buildPhotoProxyUrl(req, photoName, 400)
        );

        const photoUrl = photos[0] || null;

        return {
          placeId: p.id,
          name: p.displayName?.text,
          address: p.formattedAddress,
          latitude: p.location?.latitude,
          longitude: p.location?.longitude,
          rating: p.rating,
          totalReviews: p.userRatingCount,
          types: p.types,
          mapUrl: p.googleMapsUri,
          photo: photoUrl,
          photos
        };
      })
    );

    res.json({
      success: true,
      queryCount: queryList.length,
      partial: failedResponses.length > 0,
      failedQueries: failedResponses.length,
      total: places?.length || 0,
      places
    });

  } catch (error: any) {

    console.error(error.response?.data || error.message);

    if (isQuotaExceededError(error)) {
      return res.status(429).json({
        success: false,
        message: "RapidAPI đã hết quota trong ngày. Vui lòng thử lại ngày mai hoặc nâng gói.",
        total: 0,
        places: []
      });
    }

    res.status(500).json({
      success: false,
      message: "Search text failed"
    });

  }
};