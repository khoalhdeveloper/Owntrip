import { Request, Response } from "express";
import axios from "axios";

const RAPID_API_BASE_URL = "https://google-map-places-new-v2.p.rapidapi.com/v1";
const DEFAULT_PUBLIC_API_BASE_URL = "https://owntrip.vercel.app";

const WIKIMEDIA_HEADERS = {
  "User-Agent": "OwnTrip/1.0 (contact: owntrip@example.com)",
  "Accept-Language": "en"
};

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

const normalizeBaseUrl = (value?: string | null) => {
  const raw = String(value || "").trim().replace(/\/+$/g, "");
  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
};

const getRequestBaseUrl = (req: Request) => {
  const configuredBaseUrl = normalizeBaseUrl(process.env.PUBLIC_API_BASE_URL) || DEFAULT_PUBLIC_API_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const deploymentBaseUrl =
    normalizeBaseUrl(process.env.APP_URL) ||
    normalizeBaseUrl(process.env.API_BASE_URL) ||
    normalizeBaseUrl(process.env.BACKEND_URL) ||
    normalizeBaseUrl(process.env.RENDER_EXTERNAL_URL) ||
    normalizeBaseUrl(process.env.RAILWAY_PUBLIC_DOMAIN) ||
    normalizeBaseUrl(process.env.RAILWAY_STATIC_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL);

  if (deploymentBaseUrl) {
    return deploymentBaseUrl;
  }

  const forwardedHostHeader = req.headers["x-forwarded-host"];
  const forwardedHost = Array.isArray(forwardedHostHeader)
    ? forwardedHostHeader[0]
    : String(forwardedHostHeader || "").split(",")[0].trim();

  const forwardedProtoHeader = req.headers["x-forwarded-proto"];
  const forwardedProto = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader[0]
    : String(forwardedProtoHeader || "").split(",")[0].trim();

  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader)
    ? originHeader[0]
    : String(originHeader || "").trim();
  const originHost = origin ? origin.replace(/^https?:\/\//i, "").replace(/\/+$/g, "") : "";

  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || originHost || req.get("host") || "localhost";

  if (/^localhost(?::\d+)?$/i.test(host) || /^127\.0\.0\.1(?::\d+)?$/i.test(host)) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
};

const buildPhotoProxyUrl = (req: Request, photoName: string, maxHeightPx = 400) => {
  const baseUrl = getRequestBaseUrl(req);
  return `${baseUrl}/api/places/photo?name=${encodeURIComponent(photoName)}&maxHeightPx=${maxHeightPx}`;
};

const toSeed = (value: string) =>
  String(value || "place")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "place";

const buildFallbackPhotoUrl = (seedBase: string) => {
  const seed = toSeed(seedBase);
  return `https://picsum.photos/seed/owntrip-place-${seed}/900/600`;
};

const fetchCommonsImageBySearchTerm = async (searchTerm: string) => {
  const normalized = String(searchTerm || "").trim();
  if (!normalized) {
    return null;
  }

  const response = await axios.get("https://commons.wikimedia.org/w/api.php", {
    params: {
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: normalized,
      gsrnamespace: 6,
      gsrlimit: 1,
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: 900
    },
    headers: WIKIMEDIA_HEADERS,
    timeout: 8000
  });

  const pages = response.data?.query?.pages || {};
  const firstPage = Object.values(pages)[0] as any;
  return firstPage?.imageinfo?.[0]?.thumburl || firstPage?.imageinfo?.[0]?.url || null;
};

const parseWikipediaTitle = (wikipediaTag?: string) => {
  if (!wikipediaTag) {
    return null;
  }

  const raw = String(wikipediaTag).trim();
  if (!raw) {
    return null;
  }

  const titlePart = raw.includes(":") ? raw.split(":").slice(1).join(":") : raw;
  const title = titlePart.replace(/_/g, " ").trim();
  return title || null;
};

const parseWikidataId = (wikidataTag?: string) => {
  if (!wikidataTag) {
    return null;
  }

  const value = String(wikidataTag).trim().toUpperCase();
  if (!/^Q\d+$/.test(value)) {
    return null;
  }

  return value;
};

const wikidataIdCache = new Map<string, string | null>();
const wikidataImageCache = new Map<string, string | null>();

const fetchCommonsThumbnailFromFileName = async (fileName: string) => {
  const normalizedFileName = String(fileName || "").replace(/^File:/i, "").trim();
  if (!normalizedFileName) {
    return null;
  }

  const response = await axios.get("https://commons.wikimedia.org/w/api.php", {
    params: {
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: 900,
      titles: `File:${normalizedFileName}`
    },
    headers: WIKIMEDIA_HEADERS,
    timeout: 8000
  });

  const pages = response.data?.query?.pages || {};
  const firstPage = Object.values(pages)[0] as any;
  return firstPage?.imageinfo?.[0]?.thumburl || firstPage?.imageinfo?.[0]?.url || null;
};

const resolveWikidataIdByWikipediaTitle = async (title: string) => {
  const cacheKey = String(title || "").trim().toLowerCase();
  if (!cacheKey) {
    return null;
  }

  if (wikidataIdCache.has(cacheKey)) {
    return wikidataIdCache.get(cacheKey) || null;
  }

  const response = await axios.get("https://en.wikipedia.org/w/api.php", {
    params: {
      action: "query",
      format: "json",
      prop: "pageprops",
      redirects: 1,
      titles: title
    },
    headers: WIKIMEDIA_HEADERS,
    timeout: 8000
  });

  const pages = response.data?.query?.pages || {};
  const firstPage = Object.values(pages)[0] as any;
  const wikidataId = parseWikidataId(firstPage?.pageprops?.wikibase_item) || null;
  wikidataIdCache.set(cacheKey, wikidataId);
  return wikidataId;
};

const fetchWikimediaImageByWikidataId = async (wikidataId: string) => {
  const parsedId = parseWikidataId(wikidataId);
  if (!parsedId) {
    return null;
  }

  if (wikidataImageCache.has(parsedId)) {
    return wikidataImageCache.get(parsedId) || null;
  }

  const response = await axios.get("https://www.wikidata.org/w/api.php", {
    params: {
      action: "wbgetentities",
      format: "json",
      ids: parsedId,
      props: "claims"
    },
    headers: WIKIMEDIA_HEADERS,
    timeout: 8000
  });

  const entity = response.data?.entities?.[parsedId];
  const p18Claim = entity?.claims?.P18?.[0];
  const fileName = p18Claim?.mainsnak?.datavalue?.value;

  if (!fileName) {
    wikidataImageCache.set(parsedId, null);
    return null;
  }

  const imageUrl = await fetchCommonsThumbnailFromFileName(fileName);
  wikidataImageCache.set(parsedId, imageUrl || null);
  return imageUrl || null;
};

const fetchWikipediaImageByTitleAndLang = async (title: string, lang: "vi" | "en") => {
  const response = await axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
    params: {
      action: "query",
      format: "json",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: 900,
      redirects: 1,
      titles: title
    },
    headers: WIKIMEDIA_HEADERS,
    timeout: 8000
  });

  const pages = response.data?.query?.pages || {};
  const firstPage = Object.values(pages)[0] as any;
  return firstPage?.thumbnail?.source || null;
};

const fetchWikimediaImageByTitle = async (title: string) => {
  const viImage = await fetchWikipediaImageByTitleAndLang(title, "vi");
  if (viImage) {
    return viImage;
  }

  return fetchWikipediaImageByTitleAndLang(title, "en");
};

const guessWikiTitlesByPlaceName = (name?: string, address?: string) => {
  const placeName = String(name || "").trim();
  if (!placeName) {
    return [] as string[];
  }

  const suffix = String(address || "").split(",").map((v) => v.trim()).filter(Boolean);
  const cityOrProvince = suffix[suffix.length - 1] || "";

  return Array.from(new Set([
    placeName,
    cityOrProvince ? `${placeName}, ${cityOrProvince}` : "",
    cityOrProvince ? `${placeName} (${cityOrProvince})` : ""
  ].filter(Boolean)));
};

const enrichPlacesWithWikimedia = async (places: any[]) => {
  return Promise.all(
    places.map(async (place) => {
      const wikidataId = parseWikidataId(place?._wikidataId);
      const wikiTitle = String(place?._wikiTitle || "").trim();
      const placeName = String(place?._nameForWiki || place?.name || "").trim();
      const placeAddress = String(place?._addressForWiki || place?.address || "").trim();

      let wikiPhoto: string | null = null;

      try {
        if (wikidataId) {
          wikiPhoto = await fetchWikimediaImageByWikidataId(wikidataId);
        }

        if (!wikiPhoto && wikiTitle) {
          wikiPhoto = await fetchWikimediaImageByTitle(wikiTitle);
        }

        if (!wikiPhoto) {
          wikiPhoto = await resolveWikiPhotoByPlaceContext(placeName, placeAddress);
        }
      } catch (error: any) {
        console.error(
          `Wikimedia photo failed for ${placeName || place?.placeId || "unknown-place"}:`,
          error.response?.data || error.message
        );
      }

      const { _wikiTitle, _wikidataId, _nameForWiki, _addressForWiki, photo, photos, ...cleanPlace } = place;
      const fallbackPhoto = buildFallbackPhotoUrl(
        `${cleanPlace?.placeId || cleanPlace?.name || "place"}-${cleanPlace?.address || ""}`
      );

      const finalPhoto = wikiPhoto || fallbackPhoto;
      return {
        ...cleanPlace,
        photo: finalPhoto,
        photos: [finalPhoto]
      };
    })
  );
};

const resolveWikiPhotoByPlaceContext = async (name?: string, address?: string) => {
  const placeName = String(name || "").trim();
  const placeAddress = String(address || "").trim();
  const titleCandidates = guessWikiTitlesByPlaceName(placeName, placeAddress);

  for (const title of titleCandidates) {
    const resolvedWikidataId = await resolveWikidataIdByWikipediaTitle(title);
    if (resolvedWikidataId) {
      const wikidataPhoto = await fetchWikimediaImageByWikidataId(resolvedWikidataId);
      if (wikidataPhoto) {
        return wikidataPhoto;
      }
    }
  }

  for (const title of titleCandidates) {
    const wikiPhoto = await fetchWikimediaImageByTitle(title);
    if (wikiPhoto) {
      return wikiPhoto;
    }
  }

  if (placeName) {
    return (
      await fetchCommonsImageBySearchTerm(`${placeName} Vietnam`) ||
      await fetchCommonsImageBySearchTerm(placeName)
    );
  }

  return null;
};

const hashString = (value: string) => {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
};

const buildFallbackRating = (seedBase: string) => {
  const hash = hashString(seedBase || "place");
  const rating = 3.8 + (hash % 13) / 10; // 3.8 -> 5.0
  const totalReviews = 40 + (hash % 460); // 40 -> 499

  return {
    rating: Number(rating.toFixed(1)),
    totalReviews
  };
};

const toNumberOrNull = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeGeoapifyPlace = (item: any) => {
  const geoId = String(item?.properties?.place_id || item?.properties?.datasource?.raw?.osm_id || "").trim();
  const lat = toNumberOrNull(item?.properties?.lat ?? item?.properties?.result_type === "point" ? item?.geometry?.coordinates?.[1] : item?.properties?.lat);
  const lon = toNumberOrNull(item?.properties?.lon ?? item?.properties?.result_type === "point" ? item?.geometry?.coordinates?.[0] : item?.properties?.lon);
  const name = String(item?.properties?.name || item?.properties?.formatted || "").trim() || "Unknown place";
  const fallbackStats = buildFallbackRating(`${geoId || name}-${lat || ""}-${lon || ""}`);
  const address = item?.properties?.formatted || "";

  return {
    placeId: geoId || `geoapify_${toSeed(name)}`,
    name,
    address,
    latitude: lat,
    longitude: lon,
    rating: fallbackStats.rating,
    totalReviews: fallbackStats.totalReviews,
    types: item?.properties?.result_type ? [String(item.properties.result_type)] : [],
    mapUrl: lat !== null && lon !== null
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
      : null,
    photo: null,
    photos: [],
    _nameForWiki: name,
    _addressForWiki: address
  };
};

const normalizeOsmPlace = (place: any) => {
  const lat = Number(place?.lat);
  const lon = Number(place?.lon);
  const osmId = `${place?.osm_type || "osm"}_${place?.osm_id || place?.place_id}`;
  const wikipediaTag = place?.extratags?.wikipedia;
  const wikidataTag = place?.extratags?.wikidata;
  const wikiTitle = parseWikipediaTitle(wikipediaTag);
  const wikidataId = parseWikidataId(wikidataTag);
  const fallbackStats = buildFallbackRating(`${osmId}-${place?.display_name || ""}`);

  return {
    placeId: osmId,
    name: place?.name || place?.display_name?.split(",")?.[0]?.trim() || "Unknown place",
    address: place?.display_name || "",
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lon) ? lon : null,
    rating: fallbackStats.rating,
    totalReviews: fallbackStats.totalReviews,
    types: place?.type ? [place.type] : [],
    mapUrl: Number.isFinite(lat) && Number.isFinite(lon)
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
      : null,
    photo: null,
    photos: [],
    _wikiTitle: wikiTitle,
    _wikidataId: wikidataId,
    _nameForWiki: place?.name || place?.display_name?.split(",")?.[0]?.trim() || "",
    _addressForWiki: place?.display_name || ""
  };
};

const normalizePhotonPlace = (feature: any) => {
  const coords = Array.isArray(feature?.geometry?.coordinates)
    ? feature.geometry.coordinates
    : [];
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  const props = feature?.properties || {};
  const osmId = `${props?.osm_type || "osm"}_${props?.osm_id || props?.id || props?.osm_key || "unknown"}`;
  const wikiTitle = parseWikipediaTitle(props?.wikipedia);
  const wikidataId = parseWikidataId(props?.wikidata);
  const fallbackStats = buildFallbackRating(`${osmId}-${props?.name || ""}`);
  const addressParts = [
    props?.name,
    props?.street,
    props?.district,
    props?.city,
    props?.state,
    props?.country
  ].filter(Boolean);

  return {
    placeId: osmId,
    name: props?.name || "Unknown place",
    address: addressParts.join(", "),
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lon) ? lon : null,
    rating: fallbackStats.rating,
    totalReviews: fallbackStats.totalReviews,
    types: props?.osm_value ? [props.osm_value] : [],
    mapUrl: Number.isFinite(lat) && Number.isFinite(lon)
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
      : null,
    photo: null,
    photos: [],
    _wikiTitle: wikiTitle,
    _wikidataId: wikidataId,
    _nameForWiki: props?.name || "",
    _addressForWiki: addressParts.join(", ")
  };
};

const searchPhoton = async (queryText: string, limit: number, lat?: number, lng?: number) => {
  const response = await axios.get("https://photon.komoot.io/api", {
    params: {
      q: queryText,
      limit,
      lang: "en",
      ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lon: lng } : {})
    },
    timeout: 10000
  });

  const features = Array.isArray(response.data?.features) ? response.data.features : [];
  const places = features.map(normalizePhotonPlace);
  return enrichPlacesWithWikimedia(places);
};

const searchNominatim = async (queryText: string, limit: number) => {
  const response = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: queryText,
      format: "jsonv2",
      addressdetails: 1,
      extratags: 1,
      limit,
      countrycodes: "vn"
    },
    headers: {
      "User-Agent": "OwnTrip/1.0 (contact: owntrip@example.com)",
      "Accept-Language": "en"
    },
    timeout: 10000
  });

  const places = (Array.isArray(response.data) ? response.data : []).map(normalizeOsmPlace);
  return enrichPlacesWithWikimedia(places);
};

const searchOpenPlaces = async (queryText: string, limit: number, lat?: number, lng?: number) => {
  const merged = new Map<string, any>();
  const normalizedLimit = Math.min(Math.max(Math.floor(limit), 1), 50);

  const addPlaces = (places: any[]) => {
    for (const place of places) {
      const key = String(place?.placeId || "").trim() ||
        `${toSeed(place?.name || "")}_${place?.latitude || ""}_${place?.longitude || ""}`;

      if (!merged.has(key)) {
        merged.set(key, place);
      }

      if (merged.size >= normalizedLimit) {
        break;
      }
    }
  };

  try {
    const photonPlaces = await searchPhoton(queryText, normalizedLimit, lat, lng);
    addPlaces(photonPlaces);
    if (merged.size >= normalizedLimit) {
      return Array.from(merged.values()).slice(0, normalizedLimit);
    }
  } catch (photonError: any) {
    console.error("Photon fallback failed:", photonError.response?.data || photonError.message);
  }

  // Nominatim is intentionally skipped because public endpoint blocks server traffic frequently.

  return Array.from(merged.values()).slice(0, normalizedLimit);
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

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Missing query"
      });
    }

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

    try {
      const { q } = req.query;
      const osmPlaces = await searchOpenPlaces(String(q || ""), 10);

      return res.json({
        success: true,
        source: "osm-fallback",
        total: osmPlaces.length,
        places: osmPlaces
      });
    } catch (fallbackError: any) {
      console.error("OSM fallback failed:", fallbackError.response?.data || fallbackError.message);
      return res.status(500).json({
        success: false,
        message: "Search place failed"
      });
    }
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

    try {
      const { lat, lng, radius } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "Vui long cung cap toa do (lat, lng)"
        });
      }

      const radiusKm = radius ? Number(radius) / 1000 : 10;
      const queryText = `dia diem du lich`;
      const osmPlaces = await searchOpenPlaces(
        queryText,
        20,
        Number(lat),
        Number(lng)
      );

      return res.json({
        success: true,
        source: "osm-fallback",
        total: osmPlaces.length,
        places: osmPlaces
      });
    } catch (fallbackError: any) {
      console.error("OSM fallback nearby failed:", fallbackError.response?.data || fallbackError.message);
      return res.status(500).json({
        success: false,
        message: "Search nearby failed"
      });
    }
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
      .map((result, index) => ({ result, index }))
      .filter(
        (entry): entry is { result: PromiseFulfilledResult<any>; index: number } =>
          entry.result.status === "fulfilled"
      )
      .map((entry) => ({
        query: queryList[entry.index],
        response: entry.result.value
      }));

    const failedResponses = searchResults
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason);

    if (!successfulResponses.length) {
      const hasQuotaError = failedResponses.some((err: any) => isQuotaExceededError(err));

      const osmResults = await Promise.all(
        queryList.map((queryText) =>
          searchOpenPlaces(
            queryText,
            maxResultCount,
            lat ? Number(lat) : undefined,
            lng ? Number(lng) : undefined
          )
        )
      );

      const osmPlaces = Array.from(
        new Map(osmResults.flat().map((place: any) => [place.placeId, place])).values()
      ).slice(0, maxResultCount);

      return res.json({
        success: true,
        source: hasQuotaError ? "osm-fallback-quota" : "osm-fallback",
        queryCount: queryList.length,
        partial: false,
        failedQueries: failedResponses.length,
        total: osmPlaces.length,
        places: osmPlaces
      });
    }

    const groupedPlaces = successfulResponses.map((entry) => ({
      query: entry.query,
      places: Array.isArray(entry.response.data?.places) ? entry.response.data.places : []
    }));

    // Round-robin merge so multiple keywords contribute results more evenly.
    const uniqueById = new Map<string, any>();
    let cursor = 0;
    let hasRemaining = true;

    while (hasRemaining && uniqueById.size < maxResultCount) {
      hasRemaining = false;

      for (const group of groupedPlaces) {
        if (cursor < group.places.length) {
          hasRemaining = true;
          const place = group.places[cursor];
          if (place?.id && !uniqueById.has(place.id)) {
            uniqueById.set(place.id, place);
            if (uniqueById.size >= maxResultCount) {
              break;
            }
          }
        }
      }

      cursor += 1;
    }

    const uniqueRawPlaces = Array.from(uniqueById.values());

    const places = await Promise.all(
      uniqueRawPlaces.map(async (p: any) => {
        let wikiPhoto: string | null = null;

        try {
          wikiPhoto = await resolveWikiPhotoByPlaceContext(p.displayName?.text, p.formattedAddress);
        } catch (wikiError: any) {
          console.error(
            `Wikimedia photo failed for place ${p.id || p.displayName?.text || "unknown-place"}:`,
            wikiError.response?.data || wikiError.message
          );
        }

        const fallbackPhoto = buildFallbackPhotoUrl(
          `${p.id || "place"}-${p.displayName?.text || p.formattedAddress || ""}`
        );
        const finalPhoto = wikiPhoto || fallbackPhoto;

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
          photo: finalPhoto,
          photos: [finalPhoto]
        };
      })
    );

    res.json({
      success: true,
      queryCount: queryList.length,
      partial: failedResponses.length > 0,
      failedQueries: failedResponses.length,
      matchedQueries: groupedPlaces.filter((group) => group.places.length > 0).map((group) => group.query),
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