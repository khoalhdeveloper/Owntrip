"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTripById = exports.updateTripPublishStatus = exports.getPublishedTrips = exports.updateTrip = exports.getProvinceImageCatalog = exports.getMyTrips = exports.getTripDestinations = exports.getTripDetail = exports.createTrip = void 0;
const trip_model_1 = __importDefault(require("../models/trip.model"));
const planDay_model_1 = __importDefault(require("../models/planDay.model"));
const planPlace_model_1 = __importDefault(require("../models/planPlace.model"));
const provinceImages_1 = require("../utils/provinceImages");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const createTrip = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { title, destination, startDate, endDate, description, isPublished } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24)) + 1;
        const matchedProvince = (0, provinceImages_1.findProvinceImageByDestination)(destination);
        const trip = await trip_model_1.default.create({
            userId,
            title,
            destination,
            province: matchedProvince?.province,
            provinceImage: matchedProvince?.imageUrl,
            startDate,
            endDate,
            totalDays,
            description,
            isPublished: Boolean(isPublished)
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
        // Tạo notification cho user
        await notification_model_1.default.create({
            userId,
            title: "Tạo chuyến đi thành công",
            message: `Chuyến đi '${title}' đến ${destination} đã được tạo thành công!`,
        });
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
                dayId: day._id,
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
const getTripDestinations = async (req, res) => {
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
        const dayMap = new Map();
        for (const day of days) {
            dayMap.set(String(day._id), {
                dayId: String(day._id),
                day: day.dayNumber,
                date: day.date
            });
        }
        const dayIds = days.map((day) => day._id);
        const places = dayIds.length > 0
            ? await planPlace_model_1.default.find({ dayId: { $in: dayIds } }).sort({ order: 1, createdAt: 1 })
            : [];
        const destinations = places.map((place) => {
            const dayInfo = dayMap.get(String(place.dayId));
            return {
                dayId: String(place.dayId),
                day: dayInfo?.day,
                date: dayInfo?.date,
                place
            };
        });
        return res.json({
            success: true,
            trip: {
                _id: trip._id,
                title: trip.title,
                destination: trip.destination
            },
            totalDestinations: destinations.length,
            destinations
        });
    }
    catch (error) {
        console.error("Get trip destinations error:", error);
        return res.status(500).json({
            success: false,
            message: "Get trip destinations failed"
        });
    }
};
exports.getTripDestinations = getTripDestinations;
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
const getProvinceImageCatalog = async (req, res) => {
    try {
        const { q } = req.query;
        const normalizedQ = q ? (0, provinceImages_1.normalizeText)(String(q)) : "";
        const provinces = (0, provinceImages_1.getProvinceImages)().filter((item) => {
            if (!normalizedQ) {
                return true;
            }
            return ((0, provinceImages_1.normalizeText)(item.province).includes(normalizedQ) ||
                item.keywords.some((keyword) => keyword.includes(normalizedQ)));
        });
        return res.json({
            success: true,
            total: provinces.length,
            provinces
        });
    }
    catch (error) {
        console.error("Get province images error:", error);
        return res.status(500).json({
            success: false,
            message: "Get province images failed"
        });
    }
};
exports.getProvinceImageCatalog = getProvinceImageCatalog;
const updateTrip = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { tripId } = req.params;
        const { title, destination, startDate, endDate, description, isPublished } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const trip = await trip_model_1.default.findOne({ _id: tripId, userId });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found or you do not have permission"
            });
        }
        if (title !== undefined) {
            trip.title = title;
        }
        if (description !== undefined) {
            trip.description = description;
        }
        if (typeof isPublished === "boolean") {
            trip.isPublished = isPublished;
        }
        if (destination !== undefined) {
            trip.destination = destination;
            const matchedProvince = (0, provinceImages_1.findProvinceImageByDestination)(destination);
            trip.province = matchedProvince?.province;
            trip.provinceImage = matchedProvince?.imageUrl;
        }
        if (req.body.accommodation !== undefined) {
            trip.accommodation = req.body.accommodation;
            // Đảm bảo mongoose nhận biết trường này đã thay đổi
            trip.markModified('accommodation');
        }
        const nextStartDate = startDate ? new Date(startDate) : new Date(trip.startDate);
        const nextEndDate = endDate ? new Date(endDate) : new Date(trip.endDate);
        if (Number.isNaN(nextStartDate.getTime()) || Number.isNaN(nextEndDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid startDate or endDate"
            });
        }
        if (nextEndDate.getTime() < nextStartDate.getTime()) {
            return res.status(400).json({
                success: false,
                message: "endDate must be greater than or equal to startDate"
            });
        }
        const nextTotalDays = Math.ceil((nextEndDate.getTime() - nextStartDate.getTime()) /
            (1000 * 60 * 60 * 24)) + 1;
        const currentStartMs = new Date(trip.startDate).setHours(0, 0, 0, 0);
        const currentEndMs = new Date(trip.endDate).setHours(0, 0, 0, 0);
        const nextStartMs = new Date(nextStartDate).setHours(0, 0, 0, 0);
        const nextEndMs = new Date(nextEndDate).setHours(0, 0, 0, 0);
        const dateRangeChanged = currentStartMs !== nextStartMs ||
            currentEndMs !== nextEndMs ||
            trip.totalDays !== nextTotalDays;
        trip.startDate = nextStartDate;
        trip.endDate = nextEndDate;
        trip.totalDays = nextTotalDays;
        await trip.save();
        if (dateRangeChanged) {
            const existingDays = await planDay_model_1.default.find({ tripId }).sort({ dayNumber: 1 });
            const existingDayByNumber = new Map();
            for (const day of existingDays) {
                if (!existingDayByNumber.has(day.dayNumber)) {
                    existingDayByNumber.set(day.dayNumber, day);
                }
            }
            for (let dayNumber = 1; dayNumber <= nextTotalDays; dayNumber++) {
                const nextDate = new Date(nextStartDate);
                nextDate.setDate(nextStartDate.getDate() + (dayNumber - 1));
                const existingDay = existingDayByNumber.get(dayNumber);
                if (!existingDay) {
                    await planDay_model_1.default.create({
                        tripId,
                        dayNumber,
                        date: nextDate
                    });
                    continue;
                }
                existingDay.date = nextDate;
                await existingDay.save();
            }
            const redundantDays = existingDays.filter((day) => day.dayNumber > nextTotalDays);
            const redundantDayIds = redundantDays.map((day) => day._id);
            if (redundantDayIds.length > 0) {
                await planPlace_model_1.default.deleteMany({ dayId: { $in: redundantDayIds } });
                await planDay_model_1.default.deleteMany({ _id: { $in: redundantDayIds } });
            }
        }
        const days = await planDay_model_1.default.find({ tripId }).sort({ dayNumber: 1 });
        const result = [];
        for (const day of days) {
            const places = await planPlace_model_1.default.find({ dayId: day._id }).sort({ order: 1 });
            result.push({
                dayId: day._id,
                day: day.dayNumber,
                date: day.date,
                places
            });
        }
        return res.json({
            success: true,
            message: "Trip updated successfully",
            trip,
            days: result
        });
    }
    catch (error) {
        console.error("Update trip error:", error);
        return res.status(500).json({
            success: false,
            message: "Update trip failed"
        });
    }
};
exports.updateTrip = updateTrip;
const getPublishedTrips = async (req, res) => {
    try {
        const { limit, page, destination } = req.query;
        const parsedLimit = Number(limit);
        const parsedPage = Number(page);
        const pageSize = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(Math.floor(parsedLimit), 1), 50)
            : 20;
        const currentPage = Number.isFinite(parsedPage)
            ? Math.max(Math.floor(parsedPage), 1)
            : 1;
        const filters = { isPublished: true };
        if (destination) {
            filters.destination = { $regex: destination, $options: "i" };
        }
        const [trips, total] = await Promise.all([
            trip_model_1.default.find(filters)
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * pageSize)
                .limit(pageSize),
            trip_model_1.default.countDocuments(filters)
        ]);
        return res.json({
            success: true,
            page: currentPage,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            trips
        });
    }
    catch (error) {
        console.error("Get published trips error:", error);
        return res.status(500).json({
            success: false,
            message: "Get published trips failed"
        });
    }
};
exports.getPublishedTrips = getPublishedTrips;
const updateTripPublishStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { tripId } = req.params;
        const { isPublished } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        if (typeof isPublished !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isPublished must be boolean"
            });
        }
        const trip = await trip_model_1.default.findOneAndUpdate({ _id: tripId, userId }, { isPublished }, { new: true });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found or you do not have permission"
            });
        }
        return res.json({
            success: true,
            message: isPublished ? "Trip published successfully" : "Trip unpublished successfully",
            trip
        });
    }
    catch (error) {
        console.error("Update trip publish status error:", error);
        return res.status(500).json({
            success: false,
            message: "Update trip publish status failed"
        });
    }
};
exports.updateTripPublishStatus = updateTripPublishStatus;
const deleteTripById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { tripId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const trip = await trip_model_1.default.findOne({ _id: tripId, userId });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found or you do not have permission"
            });
        }
        const planDays = await planDay_model_1.default.find({ tripId }).select("_id");
        const dayIds = planDays.map((day) => day._id);
        if (dayIds.length > 0) {
            await planPlace_model_1.default.deleteMany({ dayId: { $in: dayIds } });
        }
        await planDay_model_1.default.deleteMany({ tripId });
        await trip_model_1.default.deleteOne({ _id: tripId, userId });
        return res.json({
            success: true,
            message: "Trip deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete trip error:", error);
        return res.status(500).json({
            success: false,
            message: "Delete trip failed"
        });
    }
};
exports.deleteTripById = deleteTripById;
