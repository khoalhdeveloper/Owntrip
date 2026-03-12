import { Request, Response } from "express";
import axios from "axios";

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

    const { q, lat, lng, radius, type } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Missing query"
      });
    }

    const requestBody: any = {
      textQuery: q,
      languageCode: "vi",
      regionCode: "VN",
      maxResultCount: 20
    };

    if (lat && lng) {
      requestBody.locationBias = {
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
      requestBody.includedType = type;
    }

    const response = await axios.post(
      "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText",
      requestBody,
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

    const places = response.data.places?.map((p: any) => {

      const photo = p.photos?.[0];

      const photoUrl = photo
        ? `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&key=${process.env.GOOGLE_API_KEY}`
        : null;

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
        photo: photoUrl
      };
    });

    res.json({
      success: true,
      total: places?.length || 0,
      places
    });

  } catch (error: any) {

    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Search text failed"
    });

  }
};