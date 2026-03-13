"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTrips = exports.getTripDetail = exports.createTrip = void 0;
const trip_model_1 = __importDefault(require("../models/trip.model"));
const planDay_model_1 = __importDefault(require("../models/planDay.model"));
const planPlace_model_1 = __importDefault(require("../models/planPlace.model"));
const createTrip = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { title, destination, startDate, endDate, description } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24)) + 1;
        const trip = await trip_model_1.default.create({
            userId,
            title,
            destination,
            startDate,
            endDate,
            totalDays,
            description
        });
        const days = [];
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            days.push({
                tripId: trip._id,
                dayNumber: i + 1,
                date
            });
        }
        await planDay_model_1.default.insertMany(days);
        res.json({
            success: true,
            trip
        });
    }
    catch (error) {
        console.error("Create trip error:", error);
        res.status(500).json({
            success: false,
            message: "Create trip failed",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.createTrip = createTrip;
const getTripDetail = async (req, res) => {
    try {
        const { tripId } = req.params;
        const trip = await trip_model_1.default.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }
        const days = await planDay_model_1.default.find({ tripId }).sort({ dayNumber: 1 });
        const result = [];
        for (const day of days) {
            const places = await planPlace_model_1.default.find({ dayId: day._id }).sort({
                order: 1,
            });
            result.push({
                day: day.dayNumber,
                date: day.date,
                places,
            });
        }
        res.json({
            success: true,
            trip,
            days: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Get trip detail failed",
        });
    }
};
exports.getTripDetail = getTripDetail;
const getMyTrips = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const trips = await trip_model_1.default.find({ userId }).sort({ createdAt: -1 });
        res.json({
            success: true,
            total: trips.length,
            trips
        });
    }
    catch (error) {
        console.error("Get my trips error:", error);
        res.status(500).json({
            success: false,
            message: "Get trips failed"
        });
    }
};
exports.getMyTrips = getMyTrips;
