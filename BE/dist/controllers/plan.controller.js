"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPlaceToDay = void 0;
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
