import { Request, Response } from "express";
import axios from "axios";
import Place from "../models/place.model";
import { findProvinceImageByDestination, normalizeText } from "../utils/provinceImages";

const GOONG_API_BASE_URL = "https://rsapi.goong.io";
const DEFAULT_PUBLIC_API_BASE_URL = "https://owntrip.vercel.app";

const getGoongKey = () => process.env.GOONG_API_KEY!;
const getSerpApiKey = () => process.env.SERPAPI_API_KEY || "";

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

const fetchSerpApiPlaceData = async (query: string) => {
  const apiKey = getSerpApiKey();
  if (!apiKey) return null;

  try {
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_maps",
        q: query,
        api_key: apiKey,
        type: "search"
      },
      timeout: 10000
    });

    const result = response.data?.place_results || response.data?.local_results?.[0];
    if (!result) {
      // Fallback to google_images if maps doesn't return a specific place
      const imgRes = await axios.get("https://serpapi.com/search", {
        params: {
          engine: "google_images",
          q: query,
          api_key: apiKey
        },
        timeout: 8000
      });
      const images = imgRes.data?.images_results || [];
      const jpgImg = images.find((img: any) => String(img.original || "").toLowerCase().includes(".jpg"));
      return {
        photo: jpgImg?.original || images[0]?.original || images[0]?.thumbnail || null
      };
    }

    return {
      photo: result.thumbnail || result.gps_coordinates?.image || null,
      thumbnail: result.thumbnail || null,
      thumbnail_large: result.thumbnail_large || result.gps_coordinates?.image || null,
      rating: result.rating,
      reviews: result.reviews,
      reviews_original: result.reviews_original || (result.reviews ? `(${result.reviews})` : null),
      position: result.position || 1,
      price: result.price || null,
      type: result.type || null,
      gps_coordinates: result.gps_coordinates || null,
      address: result.address || null,
      place_id: result.place_id || null,
      provider_id: result.provider_id || null
    };
  } catch (error: any) {
    console.error("SerpApi place data fetch failed:", error.message);
    return null;
  }
};

const resolvePlacePhoto = async (name?: string, address?: string) => {
  const placeName = String(name || "").trim();
  const placeAddress = String(address || "").trim();

  if (placeName) {
    return await fetchSerpApiPlaceData(`${placeName} ${placeAddress}`.trim());
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

const buildSearchTerms = (value: string) => {
  const raw = String(value || "").trim();
  const normalized = normalizeText(raw);
  const terms = new Set<string>();

  const addTerm = (term?: string) => {
    const normalizedTerm = normalizeText(String(term || ""));
    if (normalizedTerm) {
      terms.add(normalizedTerm);
    }
  };

  addTerm(raw);
  addTerm(normalized);

  const province = findProvinceImageByDestination(raw);
  if (province) {
    addTerm(province.province);
    province.keywords.forEach(addTerm);
  }

  const strippedPrefix = normalized
    .replace(/^(tp|thanh pho|thanh-pho)\s+/i, "")
    .replace(/^(tp|thanh pho|thanh-pho)\.?\s*/i, "");

  addTerm(strippedPrefix);

  return Array.from(terms);
};

const isSameLocality = (left?: string | null, right?: string | null) => {
  const normalizedLeft = normalizeText(String(left || ""));
  const normalizedRight = normalizeText(String(right || ""));

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
};

export const getPlacePhoto = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Missing photo name"
      });
    }

    if (String(name).startsWith("http")) {
      return res.redirect(String(name));
    }

    return res.status(404).json({
      success: false,
      message: "Photo not found or Goong API does not support this photo reference"
    });
  } catch (error: any) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Get place photo failed"
    });
  }
};

export const searchPlace = async (req: Request, res: Response) => {
  try {
    const { q, lat, lng } = req.query;
    const rawQuery = String(q || "");
    const searchTerms = buildSearchTerms(rawQuery);
    const normalizedQuery = normalizeText(rawQuery);

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Missing query"
      });
    }

    // 1. Tìm kiếm trong database local trước (Ưu tiên tuyệt đối nếu có dữ liệu)
    const localPlaces = await Place.find({
      $or: [
        { placeId: rawQuery },
        ...searchTerms.flatMap((term) => [
          { name: { $regex: term, $options: "i" } },
          { address: { $regex: term, $options: "i" } },
          { city: { $regex: term, $options: "i" } },
          { placeId: { $regex: term, $options: "i" } }
        ])
      ]
    }).sort({ addedCount: -1 }).limit(20);

    if (localPlaces.length > 0) {
      return res.json({
        success: true,
        source: "local-db",
        total: localPlaces.length,
        places: localPlaces.map(p => ({
          id: p.placeId,
          displayName: { text: p.name, languageCode: "vi" },
          formattedAddress: p.address,
          location: {
            latitude: p.location?.lat,
            longitude: p.location?.lng
          },
          rating: p.rating,
          userRatingCount: p.reviewCount,
          types: p.category ? [p.category] : [],
          photos: p.images?.map(img => ({ name: img })),
          addedCount: p.addedCount || 0
        }))
      });
    }

    const response = await axios.get(
      `${GOONG_API_BASE_URL}/v2/place/autocomplete`,
      {
        params: {
          api_key: getGoongKey(),
          input: rawQuery,
          location: lat && lng ? `${String(lat)},${String(lng)}` : undefined,
          limit: 20, // Tăng limit lên 20 để có pool kết quả lớn hơn trước khi lọc
          more_compound: true
        }
      }
    );

    let predictions = response.data?.predictions || [];
    const lowerQ = normalizedQuery;

    // Tìm xem có kết quả nào là đơn vị hành chính trùng tên với từ khóa tìm kiếm không (ví dụ: tìm "Đà Lạt" ra "Thành phố Đà Lạt")
    const adminUnit = predictions.find((p: any) => {
      const mainText = normalizeText(p.structured_formatting?.main_text || "");
      const isLocality = p.types?.some((t: string) => 
        ["province", "district", "locality", "administrative_area_level_1", "administrative_area_level_2"].includes(t)
      );
      return isLocality && isSameLocality(mainText, lowerQ);
    });

    if (adminUnit) {
      const targetProvince = adminUnit.compound?.province;
      if (targetProvince) {
        // Lọc nghiêm ngặt: Chỉ giữ lại các địa điểm thuộc cùng Tỉnh/Thành phố
        predictions = predictions.filter((p: any) => {
          const pProvince = p.compound?.province;
          return isSameLocality(pProvince, targetProvince);
        });
      }
    }

    // Danh sách các type liên quan đến du lịch/tham quan
    const touristTypes = [
      "tourist_attraction",
      "point_of_interest",
      "museum",
      "park",
      "natural_feature",
      "establishment",
      "site",
      "church",
      "pagoda",
      "temple",
      "monument"
    ];

    // Các từ khóa gợi ý là địa điểm du lịch trong tiếng Việt
    const touristKeywords = ["du lịch", "thắng cảnh", "di tích", "chùa", "nhà thờ", "công viên", "bảo tàng", "thác", "hồ"];

    // Ưu tiên các địa điểm du lịch và khớp với khu vực tìm kiếm
    predictions.sort((a: any, b: any) => {
      // Ưu tiên 1: Địa điểm du lịch
      const aTypes = a.types || [];
      const bTypes = b.types || [];
      const aDesc = (a.description || "").toLowerCase();
      const bDesc = (b.description || "").toLowerCase();

      const aIsTourist = 
        aTypes.some((t: string) => touristTypes.includes(t)) || 
        touristKeywords.some(k => aDesc.includes(k));
      const bIsTourist = 
        bTypes.some((t: string) => touristTypes.includes(t)) || 
        touristKeywords.some(k => bDesc.includes(k));
      
      if (aIsTourist && !bIsTourist) return -1;
      if (!aIsTourist && bIsTourist) return 1;

      return 0;
    });

    // Sau khi sắp xếp thì lấy 5 kết quả tốt nhất
    predictions = predictions.slice(0, 5);
    const formattedPlaces = await Promise.all(
      predictions.map(async (p: any) => {
        const name = p.structured_formatting?.main_text || p.description;
        const address = p.description;

        let serpData: any = null;
        try {
          serpData = await resolvePlacePhoto(name, address);
        } catch (e) {}

        const fallbackPhoto = buildFallbackPhotoUrl(`${p.place_id}-${name}`);
        const finalPhoto = serpData?.photo || fallbackPhoto;

        // Gắn thêm thông tin từ SerpApi vào chính object prediction gốc
        p.photo = finalPhoto;
        p.photos = [finalPhoto];
        if (serpData?.rating) p.rating = serpData.rating;
        if (serpData?.reviews) p.user_ratings_total = serpData.reviews;
        if (serpData?.reviews_original) p.reviews_original = serpData.reviews_original;
        if (serpData?.position) p.position = serpData.position;
        if (serpData?.price) p.price = serpData.price;
        if (serpData?.type) p.type = serpData.type;
        if (serpData?.thumbnail_large) p.thumbnail_large = serpData.thumbnail_large;
        if (serpData?.gps_coordinates) p.gps_coordinates = serpData.gps_coordinates;
        if (serpData?.place_id) p.serp_place_id = serpData.place_id;
        if (serpData?.provider_id) p.provider_id = serpData.provider_id;

        return {
          placeId: p.place_id,
          name: name,
          address: address,
          types: p.types || [],
          source: "goong",
          photo: finalPhoto,
          photos: [finalPhoto],
          rating: serpData?.rating || p.rating,
          totalReviews: serpData?.reviews || p.user_ratings_total,
          reviewsOriginal: serpData?.reviews_original,
          position: serpData?.position,
          price: serpData?.price,
          type: serpData?.type,
          thumbnailLarge: serpData?.thumbnail_large,
          gpsCoordinates: serpData?.gps_coordinates,
          serpPlaceId: serpData?.place_id,
          providerId: serpData?.provider_id
        };
      })
    );

    res.json({
      success: true,
      source: "goong",
      predictions: predictions,
      places: formattedPlaces
    });
  } catch (error: any) {
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

    const typeToQuery: Record<string, string> = {
      restaurant: "nhà hàng",
      cafe: "cà phê",
      hotel: "khách sạn",
      hospital: "bệnh viện",
      atm: "ATM",
      school: "trường học",
      supermarket: "siêu thị",
      pharmacy: "nhà thuốc",
    };

    const searchQuery = type
      ? (typeToQuery[String(type).trim().toLowerCase()] || String(type).trim())
      : "địa điểm";

    const searchTerms = buildSearchTerms(searchQuery);

    // 1. Tìm kiếm trong database local trước
    const localPlaces = await Place.find({
      $or: searchTerms.flatMap((term) => [
        { name: { $regex: term, $options: "i" } },
        { address: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { city: { $regex: term, $options: "i" } }
      ])
    }).sort({ addedCount: -1 }).limit(10);

    if (localPlaces.length > 0) {
      const formattedPlaces = localPlaces.map(p => ({
        placeId: p.placeId,
        name: p.name,
        address: p.address,
        latitude: p.location?.lat,
        longitude: p.location?.lng,
        rating: p.rating,
        totalReviews: p.reviewCount,
        types: p.category ? [p.category] : [],
        mapUrl: p.location?.lat
          ? `https://www.google.com/maps/search/?api=1&query=${p.location.lat},${p.location.lng}`
          : null,
        photo: p.images?.[0] || null,
        photos: p.images || [],
        addedCount: p.addedCount || 0
      }));

      return res.json({
        success: true,
        source: "local-db",
        total: formattedPlaces.length,
        places: formattedPlaces
      });
    }

    const autocompleteRes = await axios.get(
      `${GOONG_API_BASE_URL}/v2/place/autocomplete`,
      {
        params: {
          api_key: getGoongKey(),
          input: searchQuery,
          location: `${String(lat)},${String(lng)}`,
          radius: radius ? Number(radius) : 1000,
          limit: 10
        }
      }
    );

    const predictions = autocompleteRes.data?.predictions || [];

    if (predictions.length === 0) {
      return res.json({ success: true, source: "goong", total: 0, places: [] });
    }

    const detailResults = await Promise.allSettled(
      predictions.slice(0, 10).map((p: any) =>
        axios.get(`${GOONG_API_BASE_URL}/v2/place/detail`, {
          params: {
            api_key: getGoongKey(),
            place_id: p.place_id
          }
        })
      )
    );

    const places = (await Promise.all(
      detailResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map(async (r) => {
          const d = r.value.data?.result;
          if (!d) return null;

          const name = d.name;
          const address = d.formatted_address;

          let serpData: any = null;
          try {
            serpData = await resolvePlacePhoto(name, address);
          } catch (e) {}

          const fallbackPhoto = buildFallbackPhotoUrl(`${d.place_id}-${name}`);
          const finalPhoto = serpData?.photo || fallbackPhoto;

          return {
            placeId: d.place_id,
            name: name,
            address: address,
            latitude: d.geometry?.location?.lat,
            longitude: d.geometry?.location?.lng,
            rating: serpData?.rating || d.rating,
            totalReviews: serpData?.reviews || d.user_ratings_total,
            reviewsOriginal: serpData?.reviews_original,
            position: serpData?.position,
            price: serpData?.price,
            type: serpData?.type,
            thumbnailLarge: serpData?.thumbnail_large,
            gpsCoordinates: serpData?.gps_coordinates,
            serpPlaceId: serpData?.place_id,
            providerId: serpData?.provider_id,
            types: d.types || [],
            mapUrl: d.geometry?.location?.lat
              ? `https://www.google.com/maps/search/?api=1&query=${d.geometry.location.lat},${d.geometry.location.lng}`
              : null,
            photo: finalPhoto,
            photos: [finalPhoto]
          };
        })
    )).filter(Boolean);

    res.json({
      success: true,
      source: "goong",
      total: places.length,
      places
    });
  } catch (error: any) {
    console.error("Goong searchNearby error:", error?.response?.data || error?.message || error);
    res.status(500).json({ success: false, message: "Search nearby failed" });
  }
};

export const searchText = async (req: Request, res: Response) => {
  try {
    const { q, address, lat, lng, radius, limit } = req.query;
    const rawQuery = q || address;
    const normalizedQuery = normalizeText(String(rawQuery || ""));

    if (!rawQuery) {
      return res.status(400).json({
        success: false,
        message: "Missing query"
      });
    }

    const maxResultCount = limit ? Math.min(Number(limit), 50) : 20;

    const queryList = (Array.isArray(rawQuery) ? rawQuery : [rawQuery])
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const expandedQueryList = Array.from(new Set(queryList.flatMap((item) => buildSearchTerms(item))));

    if (!expandedQueryList.length) {
      return res.status(400).json({
        success: false,
        message: "Missing query"
      });
    }

    // 1. Thử tìm kiếm trong database local trước
    const dbResults = await Place.find({
      $or: [
        ...queryList.map(qText => ({ placeId: qText })),
        ...expandedQueryList.flatMap((queryText) => [
          { name: { $regex: queryText, $options: "i" } },
          { address: { $regex: queryText, $options: "i" } },
          { city: { $regex: queryText, $options: "i" } },
          { placeId: { $regex: queryText, $options: "i" } }
        ])
      ]
    }).sort({ addedCount: -1 }).limit(maxResultCount);

    if (dbResults.length > 0) {
      const formattedPlaces = dbResults.map(p => ({
        placeId: p.placeId,
        name: p.name,
        address: p.address,
        latitude: p.location?.lat,
        longitude: p.location?.lng,
        rating: p.rating,
        totalReviews: p.reviewCount,
        types: p.category ? [p.category] : [],
        photo: p.images?.[0],
        photos: p.images,
        addedCount: p.addedCount || 0
      }));

      // Trả về ngay nếu có bất kỳ kết quả nào trong DB local
      if (formattedPlaces.length > 0) {
        return res.json({
          success: true,
          source: "local-db",
          queryCount: queryList.length,
          total: formattedPlaces.length,
          places: formattedPlaces
        });
      }
    }

    const searchResults = await Promise.allSettled(
      queryList.map((queryText) =>
        axios.get(`${GOONG_API_BASE_URL}/v2/place/autocomplete`, {
          params: {
            api_key: getGoongKey(),
            input: queryText,
            location: lat && lng ? `${String(lat)},${String(lng)}` : undefined,
            radius: radius ? Number(radius) : undefined,
            more_compound: true
          }
        })
      )
    );

    let allPredictions = searchResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .flatMap((result) => result.value.data?.predictions || []);

    const lowerQ = normalizedQuery;
    
    // Bổ sung lọc đơn vị hành chính cho searchText tương tự searchPlace
    const adminUnit = allPredictions.find((p: any) => {
      const mainText = normalizeText(p.structured_formatting?.main_text || "");
      const isLocality = p.types?.some((t: string) => 
        ["province", "district", "locality", "administrative_area_level_1", "administrative_area_level_2"].includes(t)
      );
      return isLocality && isSameLocality(mainText, lowerQ);
    });

    if (adminUnit) {
      const targetProvince = adminUnit.compound?.province;
      if (targetProvince) {
        allPredictions = allPredictions.filter((p: any) => {
          const pProvince = p.compound?.province;
          return isSameLocality(pProvince, targetProvince);
        });
      }
    }

    // Danh sách các type liên quan đến du lịch/tham quan
    const touristTypes = [
      "tourist_attraction",
      "point_of_interest",
      "museum",
      "park",
      "natural_feature",
      "establishment",
      "site",
      "church",
      "pagoda",
      "temple",
      "monument"
    ];

    const touristKeywords = ["du lịch", "thắng cảnh", "di tích", "chùa", "nhà thờ", "công viên", "bảo tàng", "thác", "hồ"];

    // Ưu tiên các địa điểm du lịch
    allPredictions.sort((a: any, b: any) => {
      const aTypes = a.types || [];
      const bTypes = b.types || [];
      const aIsTourist = aTypes.includes("tourist_attraction") || aTypes.includes("point_of_interest");
      const bIsTourist = bTypes.includes("tourist_attraction") || bTypes.includes("point_of_interest");
      
      if (aIsTourist && !bIsTourist) return -1;
      if (!aIsTourist && bIsTourist) return 1;
      return 0;
    });

    const uniquePredictions = new Map<string, any>();
    for (const p of allPredictions) {
      if (p.place_id && !uniquePredictions.has(p.place_id)) {
        uniquePredictions.set(p.place_id, p);
      }
      if (uniquePredictions.size >= maxResultCount) break;
    }

    const detailResults = await Promise.allSettled(
      Array.from(uniquePredictions.values()).map((p) =>
        axios.get(`${GOONG_API_BASE_URL}/v2/place/detail`, {
          params: {
            api_key: getGoongKey(),
            place_id: p.place_id
          }
        })
      )
    );

    const places = await Promise.all(
      detailResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map(async (r) => {
          const d = r.value.data?.result;
          if (!d) return null;

          const name = d.name;
          const address = d.formatted_address;

          let serpData: any = null;
          try {
            serpData = await resolvePlacePhoto(name, address);
          } catch (e) {}

          const fallbackPhoto = buildFallbackPhotoUrl(`${d.place_id}-${name}`);
          const finalPhoto = serpData?.photo || fallbackPhoto;

          return {
            placeId: d.place_id,
            name: name,
            address: address,
            latitude: d.geometry?.location?.lat,
            longitude: d.geometry?.location?.lng,
            rating: serpData?.rating || d.rating,
            totalReviews: serpData?.reviews || d.user_ratings_total,
            reviewsOriginal: serpData?.reviews_original,
            position: serpData?.position,
            price: serpData?.price,
            type: serpData?.type,
            thumbnailLarge: serpData?.thumbnail_large,
            gpsCoordinates: serpData?.gps_coordinates,
            serpPlaceId: serpData?.place_id,
            providerId: serpData?.provider_id,
            types: d.types || [],
            mapUrl: d.geometry?.location?.lat
              ? `https://www.google.com/maps/search/?api=1&query=${d.geometry.location.lat},${d.geometry.location.lng}`
              : null,
            photo: finalPhoto,
            photos: [finalPhoto]
          };
        })
    );

    const filteredPlaces = places.filter(Boolean);

    res.json({
      success: true,
      source: "goong",
      total: filteredPlaces.length,
      places: filteredPlaces
    });
  } catch (error: any) {
    console.error("Goong searchText failed:", error.message);
    res.status(500).json({ success: false, message: "Search text failed" });
  }
};

export const getPlaceChildren = async (req: Request, res: Response) => {
  try {
    const { parent_id, has_deprecated_administrative_unit } = req.query;

    if (!parent_id) {
      return res.status(400).json({
        success: false,
        message: "Missing parent_id"
      });
    }

    const response = await axios.get(
      "https://rsapi.goong.io/v2/place/children",
      {
        params: {
          parent_id: String(parent_id),
          api_key: getGoongKey(),
          has_deprecated_administrative_unit: has_deprecated_administrative_unit === "true"
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Goong getPlaceChildren failed:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch place children"
    });
  }
};

/**
 * Get top places by `addedCount`.
 * Query params:
 * - `minAddedCount` (number, default 1): minimal addedCount to include
 * - `limit` (number, default 10, max 50): number of results to return
 */
export const getTopAddedPlaces = async (req: Request, res: Response) => {
  try {
    const { minAddedCount = "1", limit = "10" } = req.query;
    const min = Math.max(0, Number(minAddedCount) || 1);
    const lim = Math.min(50, Math.max(1, Number(limit) || 10));

    const results = await Place.find({ addedCount: { $gte: min } })
      .sort({ addedCount: -1 })
      .limit(lim);

    const places = results.map((p) => ({
      placeId: p.placeId,
      name: p.name,
      address: p.address,
      latitude: p.location?.lat,
      longitude: p.location?.lng,
      rating: p.rating,
      totalReviews: p.reviewCount,
      types: p.category ? [p.category] : [],
      photo: p.images?.[0],
      photos: p.images,
      addedCount: p.addedCount || 0
    }));

    return res.json({ success: true, total: places.length, places });
  } catch (error: any) {
    console.error("Get top added places failed:", error?.message || error);
    return res.status(500).json({ success: false, message: "Get top added places failed" });
  }
};
