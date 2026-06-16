import Place from "../models/place.model";
import Checkin from "../models/checkin.model";
import { recordMissionCheckin } from "./missionProgress.service";

export const DEFAULT_CHECKIN_RADIUS_METERS = 1000;

type Coordinates = {
  latitude: number;
  longitude: number;
};

type PlaceModelLike = {
  find?: (filter: Record<string, unknown>) => Promise<any[]>;
  findOne?: (filter: Record<string, unknown>) => Promise<any>;
};

type CheckinModelLike = {
  findOne: (filter: Record<string, unknown>) => Promise<any>;
  create: (data: Record<string, unknown>) => Promise<any>;
};

type VerifyLocationCheckinParams = {
  userId: string;
  placeId: string;
  latitude: number;
  longitude: number;
  imageUri?: string;
  title?: string;
  date?: string;
  radiusMeters?: number;
  PlaceModel?: PlaceModelLike;
  CheckinModel?: CheckinModelLike;
  updateMissionProgress?: (params: { userId: string; placeId: string }) => Promise<{
    missionProgress: any[];
    rewards: Record<string, unknown>[];
  }>;
};

export class LocationCheckinError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const validateCoordinates = ({ latitude, longitude }: Coordinates) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new LocationCheckinError("invalid_coordinates", "Latitude and longitude must be valid numbers");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new LocationCheckinError("invalid_coordinates", "Latitude or longitude is outside valid range");
  }
};

export const calculateDistanceMeters = (from: Coordinates, to: Coordinates) => {
  validateCoordinates(from);
  validateCoordinates(to);

  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getPlaceCoordinates = (place: any): Coordinates | null => {
  const latitude = Number(place?.location?.lat);
  const longitude = Number(place?.location?.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

export const getNearbyCheckinPlaces = async ({
  latitude,
  longitude,
  radiusMeters = DEFAULT_CHECKIN_RADIUS_METERS,
  PlaceModel = Place
}: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  PlaceModel?: PlaceModelLike;
}) => {
  validateCoordinates({ latitude, longitude });

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
      if (!placeCoordinates) return null;

      const distanceMeters = calculateDistanceMeters(
        { latitude, longitude },
        placeCoordinates
      );

      if (distanceMeters > radiusMeters) return null;

      return {
        ...(typeof place.toObject === "function" ? place.toObject() : place),
        distanceMeters
      };
    })
    .filter(Boolean)
    .sort((left: any, right: any) => left.distanceMeters - right.distanceMeters);
};

export const verifyLocationCheckin = async ({
  userId,
  placeId,
  latitude,
  longitude,
  imageUri = "",
  title,
  date,
  radiusMeters = DEFAULT_CHECKIN_RADIUS_METERS,
  PlaceModel = Place,
  CheckinModel = Checkin,
  updateMissionProgress = recordMissionCheckin
}: VerifyLocationCheckinParams) => {
  validateCoordinates({ latitude, longitude });

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

  const distanceMeters = calculateDistanceMeters(
    { latitude, longitude },
    placeCoordinates
  );

  if (distanceMeters > radiusMeters) {
    throw new LocationCheckinError(
      "outside_checkin_radius",
      "User is outside check-in radius",
      400,
      { distanceMeters, radiusMeters }
    );
  }

  const existingCheckin = await CheckinModel.findOne({
    userId,
    placeId,
    source: "location"
  });

  if (existingCheckin) {
    throw new LocationCheckinError(
      "already_checked_in",
      "User already checked in to this place",
      409,
      { checkin: existingCheckin }
    );
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
