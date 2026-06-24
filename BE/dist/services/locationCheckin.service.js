"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyLocationCheckin = exports.getNearbyCheckinPlaces = exports.calculateDistanceMeters = exports.validateCoordinates = exports.LocationCheckinError = exports.DEFAULT_CHECKIN_RADIUS_METERS = void 0;
const place_model_1 = __importDefault(require("../models/place.model"));
const checkin_model_1 = __importDefault(require("../models/checkin.model"));
const missionProgress_service_1 = require("./missionProgress.service");
exports.DEFAULT_CHECKIN_RADIUS_METERS = 1000;
class LocationCheckinError extends Error {
    constructor(code, message, status = 400, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
    }
}
exports.LocationCheckinError = LocationCheckinError;
const validateCoordinates = ({ latitude, longitude }) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new LocationCheckinError("invalid_coordinates", "Latitude and longitude must be valid numbers");
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new LocationCheckinError("invalid_coordinates", "Latitude or longitude is outside valid range");
    }
};
exports.validateCoordinates = validateCoordinates;
const calculateDistanceMeters = (from, to) => {
    (0, exports.validateCoordinates)(from);
    (0, exports.validateCoordinates)(to);
    const earthRadiusMeters = 6371000;
    const toRadians = (value) => (value * Math.PI) / 180;
    const deltaLat = toRadians(to.latitude - from.latitude);
    const deltaLng = toRadians(to.longitude - from.longitude);
    const fromLat = toRadians(from.latitude);
    const toLat = toRadians(to.latitude);
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(fromLat) * Math.cos(toLat) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
exports.calculateDistanceMeters = calculateDistanceMeters;
const getPlaceCoordinates = (place) => {
    const latitude = Number(place?.location?.lat);
    const longitude = Number(place?.location?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }
    return { latitude, longitude };
};
const getNearbyCheckinPlaces = async ({ latitude, longitude, radiusMeters = exports.DEFAULT_CHECKIN_RADIUS_METERS, PlaceModel = place_model_1.default }) => {
    (0, exports.validateCoordinates)({ latitude, longitude });
    if (!PlaceModel.find) {
        throw new Error("PlaceModel.find is required");
    }
    const places = await PlaceModel.find({
        $or: [{ isCheckinEnabled: true }, { isCheckinEnabled: { $exists: false } }],
        "location.lat": { $exists: true },
        "location.lng": { $exists: true }
    });
    return places
        .map((place) => {
        const placeCoordinates = getPlaceCoordinates(place);
        if (!placeCoordinates)
            return null;
        const distanceMeters = (0, exports.calculateDistanceMeters)({ latitude, longitude }, placeCoordinates);
        if (distanceMeters > radiusMeters)
            return null;
        return {
            ...(typeof place.toObject === "function" ? place.toObject() : place),
            distanceMeters
        };
    })
        .filter(Boolean)
        .sort((left, right) => left.distanceMeters - right.distanceMeters);
};
exports.getNearbyCheckinPlaces = getNearbyCheckinPlaces;
const verifyLocationCheckin = async ({ userId, placeId, latitude, longitude, imageUri = "", title, date, radiusMeters = exports.DEFAULT_CHECKIN_RADIUS_METERS, PlaceModel = place_model_1.default, CheckinModel = checkin_model_1.default, updateMissionProgress = missionProgress_service_1.recordMissionCheckin }) => {
    (0, exports.validateCoordinates)({ latitude, longitude });
    if (!placeId) {
        throw new LocationCheckinError("missing_place_id", "placeId is required");
    }
    if (!PlaceModel.findOne) {
        throw new Error("PlaceModel.findOne is required");
    }
    const place = await PlaceModel.findOne({
        placeId,
        $or: [{ isCheckinEnabled: true }, { isCheckinEnabled: { $exists: false } }]
    });
    if (!place) {
        throw new LocationCheckinError("invalid_place", "Place not found or check-in disabled", 404);
    }
    const placeCoordinates = getPlaceCoordinates(place);
    if (!placeCoordinates) {
        throw new LocationCheckinError("invalid_place_location", "Place does not have valid coordinates");
    }
    const distanceMeters = (0, exports.calculateDistanceMeters)({ latitude, longitude }, placeCoordinates);
    if (distanceMeters > radiusMeters) {
        throw new LocationCheckinError("outside_checkin_radius", "User is outside check-in radius", 400, { distanceMeters, radiusMeters });
    }
    const existingCheckin = await CheckinModel.findOne({
        userId,
        placeId,
        source: "location"
    });
    if (existingCheckin) {
        throw new LocationCheckinError("already_checked_in", "User already checked in to this place", 409, { checkin: existingCheckin });
    }
    const checkin = await CheckinModel.create({
        userId,
        placeId,
        imageUri,
        title: title || place.name || "Check-in",
        date: date || new Date().toLocaleDateString("vi-VN"),
        userLocation: { latitude, longitude },
        distanceMeters,
        source: "location",
        checkedInAt: new Date(),
        isFavorite: false
    });
    const missionResult = await updateMissionProgress({ userId, placeId });
    return {
        success: true,
        checkin,
        place,
        distanceMeters,
        missionProgress: missionResult.missionProgress,
        rewards: missionResult.rewards
    };
};
exports.verifyLocationCheckin = verifyLocationCheckin;
