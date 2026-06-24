"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCheckin = exports.toggleCheckinFavorite = exports.getMyCheckedInPlaces = exports.getMyCheckins = exports.verifyCheckinLocation = exports.getNearbyCheckinPlacesController = exports.createCheckinMemory = void 0;
const checkin_model_1 = __importDefault(require("../models/checkin.model"));
const place_model_1 = __importDefault(require("../models/place.model"));
const locationCheckin_service_1 = require("../services/locationCheckin.service");
const createCheckinMemory = async (req, res) => {
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
        const checkin = await checkin_model_1.default.create({
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
    }
    catch (error) {
        console.error("Create checkin error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the luu ky niem",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.createCheckinMemory = createCheckinMemory;
const getNearbyCheckinPlacesController = async (req, res) => {
    try {
        const latitude = Number(req.query.lat ?? req.query.latitude);
        const longitude = Number(req.query.lng ?? req.query.longitude);
        const radiusMeters = req.query.radius
            ? Math.min(Number(req.query.radius), 5000)
            : locationCheckin_service_1.DEFAULT_CHECKIN_RADIUS_METERS;
        const places = await (0, locationCheckin_service_1.getNearbyCheckinPlaces)({
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
    }
    catch (error) {
        const status = error instanceof locationCheckin_service_1.LocationCheckinError ? error.status : 500;
        return res.status(status).json({
            success: false,
            code: error instanceof locationCheckin_service_1.LocationCheckinError ? error.code : "nearby_checkins_failed",
            message: error instanceof Error ? error.message : "Khong the lay dia diem gan ban"
        });
    }
};
exports.getNearbyCheckinPlacesController = getNearbyCheckinPlacesController;
const verifyCheckinLocation = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const result = await (0, locationCheckin_service_1.verifyLocationCheckin)({
            userId,
            placeId: String(req.body.placeId || ""),
            latitude: Number(req.body.latitude),
            longitude: Number(req.body.longitude),
            imageUri: req.body.imageUri,
            title: req.body.title,
            date: req.body.date
        });
        return res.json(result);
    }
    catch (error) {
        const status = error instanceof locationCheckin_service_1.LocationCheckinError ? error.status : 500;
        return res.status(status).json({
            success: false,
            code: error instanceof locationCheckin_service_1.LocationCheckinError ? error.code : "verify_checkin_failed",
            message: error instanceof Error ? error.message : "Khong the xac thuc check-in",
            details: error instanceof locationCheckin_service_1.LocationCheckinError ? error.details : undefined
        });
    }
};
exports.verifyCheckinLocation = verifyCheckinLocation;
const getMyCheckins = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const checkins = await checkin_model_1.default.find({ userId }).sort({ createdAt: -1 });
        return res.json({
            success: true,
            total: checkins.length,
            checkins
        });
    }
    catch (error) {
        console.error("Get checkins error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the lay danh sach ky niem"
        });
    }
};
exports.getMyCheckins = getMyCheckins;
const getMyCheckedInPlaces = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const checkins = await checkin_model_1.default.find({
            userId,
            source: "location",
            placeId: { $exists: true, $ne: "" }
        }).sort({ checkedInAt: -1, createdAt: -1 });
        const placeIds = Array.from(new Set(checkins.map((checkin) => checkin.placeId).filter((placeId) => Boolean(placeId))));
        const places = await place_model_1.default.find({ placeId: { $in: placeIds } });
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
    }
    catch (error) {
        console.error("Get checked-in places error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the lay dia diem da check-in",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getMyCheckedInPlaces = getMyCheckedInPlaces;
const toggleCheckinFavorite = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const checkin = await checkin_model_1.default.findOne({ _id: id, userId });
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
    }
    catch (error) {
        console.error("Toggle favorite error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the cap nhat trang thai yeu thich"
        });
    }
};
exports.toggleCheckinFavorite = toggleCheckinFavorite;
const deleteCheckin = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const checkin = await checkin_model_1.default.findOneAndDelete({ _id: id, userId });
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
    }
    catch (error) {
        console.error("Delete checkin error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the xoa ky niem"
        });
    }
};
exports.deleteCheckin = deleteCheckin;
