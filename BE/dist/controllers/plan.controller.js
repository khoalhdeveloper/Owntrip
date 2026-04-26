"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlaceFromDay = exports.addPlaceToDay = void 0;
const planPlace_model_1 = __importDefault(require("../models/planPlace.model"));
const addPlaceToDay = async (req, res) => {
    try {
        const { dayId } = req.params;
        const { placeId, name, address, latitude, longitude, rating, photo, mapUrl } = req.body;
        const count = await planPlace_model_1.default.countDocuments({ dayId });
        const place = await planPlace_model_1.default.create({
            dayId,
            placeId,
            name,
            address,
            latitude,
            longitude,
            rating,
            photo,
            mapUrl,
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
const deletePlaceFromDay = async (req, res) => {
    try {
        const { dayId, planPlaceId } = req.params;
        const place = await planPlace_model_1.default.findOne({ _id: planPlaceId, dayId });
        if (!place) {
            return res.status(404).json({
                success: false,
                message: "Place not found in this day"
            });
        }
        const deletedOrder = typeof place.order === "number" ? place.order : 0;
        await planPlace_model_1.default.deleteOne({ _id: planPlaceId, dayId });
        if (deletedOrder > 0) {
            await planPlace_model_1.default.updateMany({ dayId, order: { $gt: deletedOrder } }, { $inc: { order: -1 } });
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
