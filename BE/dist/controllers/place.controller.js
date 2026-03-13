"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchText = exports.searchNearby = exports.searchPlace = void 0;
const axios_1 = __importDefault(require("axios"));
const searchPlace = async (req, res) => {
    try {
        const { q } = req.query;
        const response = await axios_1.default.post("https://google-map-places-new-v2.p.rapidapi.com/v1/places:autocomplete", {
            input: q,
            languageCode: "vi",
            regionCode: "VN",
            includeQueryPredictions: true
        }, {
            headers: {
                "Content-Type": "application/json",
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.photos",
                "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                "X-RapidAPI-Host": process.env.RAPIDAPI_HOST
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Search place failed"
        });
    }
};
exports.searchPlace = searchPlace;
const searchNearby = async (req, res) => {
    try {
        const { lat, lng, radius, type } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp tọa độ (lat, lng)"
            });
        }
        const includedTypes = type ? type.split(",") : ["lodging", "tourist_attraction"];
        const response = await axios_1.default.post("https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchNearby", {
            languageCode: "vi",
            regionCode: "VN",
            includedTypes: includedTypes,
            maxResultCount: 20,
            locationRestriction: {
                circle: {
                    center: {
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lng)
                    },
                    radius: radius ? parseFloat(radius) : 10000
                }
            },
            rankPreference: 0
        }, {
            headers: {
                "Content-Type": "application/json",
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.photos",
                "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                "X-RapidAPI-Host": process.env.RAPIDAPI_HOST
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Search nearby failed"
        });
    }
};
exports.searchNearby = searchNearby;
const searchText = async (req, res) => {
    try {
        const { q, lat, lng, radius, type } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Missing query"
            });
        }
        const requestBody = {
            textQuery: q,
            languageCode: "vi",
            regionCode: "VN",
            maxResultCount: 20
        };
        if (lat && lng) {
            requestBody.locationBias = {
                circle: {
                    center: {
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lng)
                    },
                    radius: radius ? parseFloat(radius) : 10000
                }
            };
        }
        if (type) {
            requestBody.includedType = type;
        }
        const response = await axios_1.default.post("https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText", requestBody, {
            headers: {
                "Content-Type": "application/json",
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.photos",
                "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                "X-RapidAPI-Host": process.env.RAPIDAPI_HOST
            }
        });
        const places = response.data.places?.map((p) => {
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
    }
    catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Search text failed"
        });
    }
};
exports.searchText = searchText;
