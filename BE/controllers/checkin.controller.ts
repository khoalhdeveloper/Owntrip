import { Response } from "express";
import Checkin from "../models/checkin.model";
import Place from "../models/place.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  DEFAULT_CHECKIN_RADIUS_METERS,
  getNearbyCheckinPlaces,
  LocationCheckinError,
  verifyLocationCheckin
} from "../services/locationCheckin.service";

export const createCheckinMemory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { imageUri, title, date, placeId } = req.body;
    if (!imageUri) {
      return res.status(400).json({
        success: false,
        message: "imageUri is required"
      });
    }

    const checkinDate = date || new Date().toLocaleDateString("vi-VN");

    const checkin = await Checkin.create({
      userId,
      placeId,
      imageUri,
      title: title || "Ky niem Check-in",
      date: checkinDate,
      source: "photo_booth",
      isFavorite: false
    });

    return res.json({
      success: true,
      message: "Luu ky niem thanh cong!",
      checkin,
      missionProgress: [],
      rewards: []
    });
  } catch (error) {
    console.error("Create checkin error:", error);
    return res.status(500).json({
      success: false,
      message: "Khong the luu ky niem",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getNearbyCheckinPlacesController = async (req: AuthRequest, res: Response) => {
  try {
    const latitude = Number(req.query.lat ?? req.query.latitude);
    const longitude = Number(req.query.lng ?? req.query.longitude);
    const radiusMeters = req.query.radius
      ? Math.min(Number(req.query.radius), 5000)
      : DEFAULT_CHECKIN_RADIUS_METERS;

    const places = await getNearbyCheckinPlaces({
      latitude,
      longitude,
      radiusMeters
    });

    return res.json({
      success: true,
      total: places.length,
      radiusMeters,
      places
    });
  } catch (error) {
    const status = error instanceof LocationCheckinError ? error.status : 500;
    return res.status(status).json({
      success: false,
      code: error instanceof LocationCheckinError ? error.code : "nearby_checkins_failed",
      message: error instanceof Error ? error.message : "Khong the lay dia diem gan ban"
    });
  }
};

export const verifyCheckinLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result = await verifyLocationCheckin({
      userId,
      placeId: String(req.body.placeId || ""),
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
      imageUri: req.body.imageUri,
      title: req.body.title,
      date: req.body.date
    });

    return res.json(result);
  } catch (error) {
    const status = error instanceof LocationCheckinError ? error.status : 500;
    return res.status(status).json({
      success: false,
      code: error instanceof LocationCheckinError ? error.code : "verify_checkin_failed",
      message: error instanceof Error ? error.message : "Khong the xac thuc check-in",
      details: error instanceof LocationCheckinError ? error.details : undefined
    });
  }
};

export const getMyCheckins = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const checkins = await Checkin.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: checkins.length,
      checkins
    });
  } catch (error) {
    console.error("Get checkins error:", error);
    return res.status(500).json({
      success: false,
      message: "Khong the lay danh sach ky niem"
    });
  }
};

export const getMyCheckedInPlaces = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const checkins = await Checkin.find({
      userId,
      source: "location",
      placeId: { $exists: true, $ne: "" }
    }).sort({ checkedInAt: -1, createdAt: -1 });

    const placeIds = Array.from(
      new Set(checkins.map((checkin) => checkin.placeId).filter((placeId): placeId is string => Boolean(placeId)))
    );
    const places = await Place.find({ placeId: { $in: placeIds } });
    const placeById = new Map(places.map((place) => [place.placeId, place]));

    const checkedInPlaces = checkins.map((checkin) => ({
      checkin,
      place: checkin.placeId ? placeById.get(checkin.placeId) || null : null,
      distanceMeters: checkin.distanceMeters,
      checkedInAt: checkin.checkedInAt || checkin.createdAt
    }));

    return res.json({
      success: true,
      total: checkedInPlaces.length,
      places: checkedInPlaces
    });
  } catch (error) {
    console.error("Get checked-in places error:", error);
    return res.status(500).json({
      success: false,
      message: "Khong the lay dia diem da check-in",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const toggleCheckinFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const checkin = await Checkin.findOne({ _id: id, userId });
    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: "Ky niem khong ton tai hoac khong thuoc quyen so huu cua ban"
      });
    }

    checkin.isFavorite = !checkin.isFavorite;
    await checkin.save();

    return res.json({
      success: true,
      message: checkin.isFavorite ? "Da them vao yeu thich" : "Da xoa khoi yeu thich",
      checkin
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Khong the cap nhat trang thai yeu thich"
    });
  }
};

export const deleteCheckin = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const checkin = await Checkin.findOneAndDelete({ _id: id, userId });
    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: "Ky niem khong ton tai hoac khong thuoc quyen so huu cua ban"
      });
    }

    return res.json({
      success: true,
      message: "Da xoa ky niem thanh cong"
    });
  } catch (error) {
    console.error("Delete checkin error:", error);
    return res.status(500).json({
      success: false,
      message: "Khong the xoa ky niem"
    });
  }
};
