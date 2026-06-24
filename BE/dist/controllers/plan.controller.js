"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderPlacesInDay = exports.deletePlaceFromDay = exports.reorderPlaces = exports.addPlaceToDay = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const planPlace_model_1 = __importDefault(require("../models/planPlace.model"));
const place_model_1 = __importDefault(require("../models/place.model"));
const planDay_model_1 = __importDefault(require("../models/planDay.model"));
const trip_model_1 = __importDefault(require("../models/trip.model"));
const forbiddenItineraryMessage = "You do not have permission to edit this itinerary";
async function assertDayOwner(dayId, userId) {
    const day = await planDay_model_1.default.findById(dayId);
    if (!day) {
        return null;
    }
    const trip = await trip_model_1.default.findOne({ _id: day.tripId, userId });
    if (!trip) {
        return null;
    }
    return { day, trip };
}
const getRequesterId = (req) => req.user?.userId;
const addPlaceToDay = async (req, res) => {
    try {
        const dayId = String(req.params.dayId);
        const userId = getRequesterId(req);
        if (!userId || !(await assertDayOwner(dayId, userId))) {
            return res.status(403).json({
                success: false,
                message: forbiddenItineraryMessage
            });
        }
        const { placeId, name, address, latitude, longitude, rating, photo, mapUrl, timeOfDay } = req.body;
        const count = await planPlace_model_1.default.countDocuments({ dayId: dayId });
        // Cập nhật bộ đếm độ phổ biến của địa điểm
        await place_model_1.default.findOneAndUpdate({ placeId }, {
            $inc: { addedCount: 1 },
            $setOnInsert: { name, address, location: { lat: latitude, lng: longitude } }
        }, { upsert: true, new: true });
        const place = await planPlace_model_1.default.create({
            dayId: dayId,
            placeId,
            name,
            address,
            latitude,
            longitude,
            rating,
            photo,
            mapUrl,
            timeOfDay,
            order: count + 1
        });
        res.json({
            success: true,
            place
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Add place failed"
        });
    }
};
exports.addPlaceToDay = addPlaceToDay;
const reorderPlaces = async (req, res) => {
    try {
        const dayId = String(req.params.dayId);
        const { placeIds } = req.body;
        const userId = getRequesterId(req);
        if (!userId || !(await assertDayOwner(dayId, userId))) {
            return res.status(403).json({
                success: false,
                message: forbiddenItineraryMessage
            });
        }
        if (!Array.isArray(placeIds)) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }
        const updates = placeIds.map((id, index) => planPlace_model_1.default.updateOne({ _id: id, dayId: dayId }, { order: index + 1 }));
        await Promise.all(updates);
        res.json({ success: true, message: "Reordered successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Reorder failed" });
    }
};
exports.reorderPlaces = reorderPlaces;
const deletePlaceFromDay = async (req, res) => {
    try {
        const dayId = String(req.params.dayId);
        const planPlaceId = String(req.params.planPlaceId);
        const userId = getRequesterId(req);
        if (!userId || !(await assertDayOwner(dayId, userId))) {
            return res.status(403).json({
                success: false,
                message: forbiddenItineraryMessage
            });
        }
        const place = await planPlace_model_1.default.findOne({ _id: planPlaceId, dayId: dayId });
        if (!place) {
            return res.status(404).json({
                success: false,
                message: "Place not found in this day"
            });
        }
        const deletedOrder = typeof place.order === "number" ? place.order : 0;
        await planPlace_model_1.default.deleteOne({ _id: planPlaceId, dayId: dayId });
        if (deletedOrder > 0) {
            await planPlace_model_1.default.updateMany({ dayId: dayId, order: { $gt: deletedOrder } }, { $inc: { order: -1 } });
        }
        return res.json({
            success: true,
            message: "Delete place successfully",
            deletedPlaceId: planPlaceId
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Delete place failed"
        });
    }
};
exports.deletePlaceFromDay = deletePlaceFromDay;
const reorderPlacesInDay = async (req, res) => {
    try {
        const { dayId, orderedPlaceIds, orderedPlanPlaceIds, placeIds } = req.body;
        const targetDayId = dayId ?? req.body.dayId;
        const orderedIds = orderedPlaceIds ?? orderedPlanPlaceIds ?? placeIds;
        if (!targetDayId) {
            return res.status(400).json({
                success: false,
                message: "dayId is required"
            });
        }
        const userId = getRequesterId(req);
        if (!userId || !(await assertDayOwner(String(targetDayId), userId))) {
            return res.status(403).json({
                success: false,
                message: forbiddenItineraryMessage
            });
        }
        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "orderedPlaceIds must be a non-empty array"
            });
        }
        const normalizedIds = orderedIds.map((value) => String(value));
        const uniqueIds = new Set(normalizedIds);
        if (uniqueIds.size !== normalizedIds.length) {
            return res.status(400).json({
                success: false,
                message: "orderedPlaceIds contains duplicate values"
            });
        }
        const places = await planPlace_model_1.default.find({ dayId: targetDayId });
        const placeByDocId = new Map();
        const placeByPlaceId = new Map();
        for (const place of places) {
            placeByDocId.set(String(place._id), place);
            placeByPlaceId.set(String(place.placeId), place);
        }
        const orderedPlaces = normalizedIds.map((id) => {
            return placeByDocId.get(id) ?? placeByPlaceId.get(id) ?? null;
        });
        const missingIds = normalizedIds.filter((id, index) => !orderedPlaces[index]);
        if (missingIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some places in orderedPlaceIds do not belong to this day",
                missingIds
            });
        }
        if (orderedPlaces.length !== places.length) {
            return res.status(400).json({
                success: false,
                message: "orderedPlaceIds must contain all places of the day"
            });
        }
        await planPlace_model_1.default.bulkWrite(orderedPlaces.map((place, index) => ({
            updateOne: {
                filter: { _id: place._id, dayId: new mongoose_1.default.Types.ObjectId(targetDayId) },
                update: { $set: { order: index + 1 } }
            }
        })));
        return res.json({
            success: true,
            message: "Reorder places successfully",
            dayId: targetDayId,
            totalPlaces: orderedPlaces.length,
            orderedPlaceIds: normalizedIds
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Reorder places failed"
        });
    }
};
exports.reorderPlacesInDay = reorderPlacesInDay;
