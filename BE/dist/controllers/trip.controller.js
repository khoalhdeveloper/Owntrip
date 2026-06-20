"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItineraryReview = exports.getMyItineraryReview = exports.submitItineraryReview = exports.getTripSalesStats = exports.renderSandboxPayment = exports.processTripOrder = exports.handlePaymentWebhook = exports.createPaymentUrl = exports.publishToMarketplace = exports.getTripPreview = exports.getMarketplaceTrips = exports.deleteTripById = exports.updateTripPublishStatus = exports.getPublishedTrips = exports.updateTrip = exports.getProvinceImageCatalog = exports.getMyTrips = exports.getOfflineTripPackage = exports.getTripDestinations = exports.getTripDetail = exports.createTrip = void 0;
const trip_model_1 = __importDefault(require("../models/trip.model"));
const planDay_model_1 = __importDefault(require("../models/planDay.model"));
const planPlace_model_1 = __importDefault(require("../models/planPlace.model"));
const provinceImages_1 = require("../utils/provinceImages");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const checkin_model_1 = __importDefault(require("../models/checkin.model"));
const frame_model_1 = __importDefault(require("../models/frame.model"));
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
        const tripId = req.params.tripId;
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
        const reviewTargetId = resolveReviewTargetTripId(trip);
        const reviewDocs = await review_model_1.default.find({ targetId: reviewTargetId, targetType: 'itinerary' })
            .sort({ createdAt: -1 })
            .lean();
        const userIds = reviewDocs.map(r => r.userId);
        const users = await user_model_1.default.find({ userId: { $in: userIds } }).select('userId displayName image').lean();
        const userMap = new Map();
        for (const u of users) {
            userMap.set(u.userId, { _id: u._id, displayName: u.displayName, image: u.image });
        }
        const reviews = reviewDocs.map(r => ({
            ...r,
            userId: userMap.get(r.userId) || { displayName: "Người dùng ẩn danh", image: "" }
        }));
        res.json({
            success: true,
            trip,
            days: result,
            reviews
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
        const tripId = req.params.tripId;
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
const getOfflineTripPackage = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const tripId = req.params.tripId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn cần đăng nhập"
            });
        }
        const trip = await trip_model_1.default.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy chuyến đi"
            });
        }
        const canAccess = trip.userId === userId || trip.isPublished || (trip.isPurchasedClone && trip.userId === userId);
        if (!canAccess) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền tải gói offline của chuyến đi này"
            });
        }
        const days = await planDay_model_1.default.find({ tripId }).sort({ dayNumber: 1 });
        const dayIds = days.map((day) => day._id);
        const places = dayIds.length > 0
            ? await planPlace_model_1.default.find({ dayId: { $in: dayIds } }).sort({ dayId: 1, order: 1 })
            : [];
        const placeIds = Array.from(new Set(places.map((place) => place.placeId).filter(Boolean)));
        const checkins = placeIds.length > 0
            ? await checkin_model_1.default.find({ userId, placeId: { $in: placeIds } }).sort({ createdAt: -1 })
            : [];
        const frameFilters = [{ isDefault: true }];
        if (trip.province) {
            frameFilters.push({ province: { $regex: trip.province, $options: "i" } });
        }
        if (trip.destination) {
            frameFilters.push({ destinationTags: { $regex: trip.destination, $options: "i" } });
        }
        const frames = await frame_model_1.default.find({
            isActive: true,
            $or: frameFilters
        }).sort({ order: 1 });
        return res.json({
            success: true,
            trip,
            days,
            places,
            checkins,
            frames,
            updatedAt: new Date(Math.max(new Date(trip.updatedAt || trip.startDate).getTime(), ...days.map((day) => new Date(day.updatedAt || day.date).getTime()), ...places.map((place) => new Date(place.updatedAt || place.createdAt).getTime()))).toISOString()
        });
    }
    catch (error) {
        console.error("Get offline package error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể tải gói offline của chuyến đi"
        });
    }
};
exports.getOfflineTripPackage = getOfflineTripPackage;
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
        const tripId = req.params.tripId;
        const { title, destination, startDate, endDate, description, isPublished, notes, budget, provinceImage } = req.body;
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
        if (provinceImage !== undefined) {
            trip.provinceImage = provinceImage;
        }
        if (req.body.accommodation !== undefined) {
            trip.accommodation = req.body.accommodation;
            // Đảm bảo mongoose nhận biết trường này đã thay đổi
            trip.markModified('accommodation');
        }
        if (notes !== undefined) {
            trip.notes = notes;
            trip.markModified('notes');
        }
        if (budget !== undefined) {
            trip.budget = budget;
            trip.markModified('budget');
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
                        tripId: tripId,
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
        const tripId = req.params.tripId;
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
        const tripId = req.params.tripId;
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
const getMarketplaceTrips = async (req, res) => {
    try {
        const { limit, page, sort } = req.query;
        const parsedLimit = Number(limit);
        const parsedPage = Number(page);
        const pageSize = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(Math.floor(parsedLimit), 1), 50)
            : 20;
        const currentPage = Number.isFinite(parsedPage)
            ? Math.max(Math.floor(parsedPage), 1)
            : 1;
        const filters = { isPublished: true, isForSale: true };
        let sortOption = { createdAt: -1 };
        if (sort === "top_sold") {
            sortOption = { soldCount: -1 };
        }
        else if (sort === "rating") {
            sortOption = { averageRating: -1 };
        }
        const [trips, total] = await Promise.all([
            trip_model_1.default.find(filters)
                .sort(sortOption)
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
        console.error("Get marketplace trips error:", error);
        return res.status(500).json({
            success: false,
            message: "Get marketplace trips failed"
        });
    }
};
exports.getMarketplaceTrips = getMarketplaceTrips;
const getTripPreview = async (req, res) => {
    try {
        const tripId = req.params.tripId;
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
            // Mask places data for preview
            const maskedPlaces = places.map((place) => ({
                dayId: place.dayId,
                order: place.order,
                timeOfDay: place.timeOfDay,
                name: "Địa điểm đã được khoá 🔒",
            }));
            result.push({
                dayId: day._id,
                day: day.dayNumber,
                date: day.date,
                places: maskedPlaces,
            });
        }
        const reviewTargetId = resolveReviewTargetTripId(trip);
        const reviewDocs = await review_model_1.default.find({ targetId: reviewTargetId, targetType: 'itinerary' })
            .sort({ createdAt: -1 })
            .lean();
        const userIds = reviewDocs.map(r => r.userId);
        const users = await user_model_1.default.find({ userId: { $in: userIds } }).select('userId displayName image').lean();
        const userMap = new Map();
        for (const u of users) {
            userMap.set(u.userId, { _id: u._id, displayName: u.displayName, image: u.image });
        }
        const reviews = reviewDocs.map(r => ({
            ...r,
            userId: userMap.get(r.userId) || { displayName: "Người dùng ẩn danh", image: "" }
        }));
        res.json({
            success: true,
            trip,
            days: result,
            reviews
        });
    }
    catch (error) {
        console.error("Get trip preview failed:", error);
        res.status(500).json({
            success: false,
            message: "Get trip preview failed",
            errorMsg: error?.message,
            errorStack: error?.stack,
        });
    }
};
exports.getTripPreview = getTripPreview;
const mongoose_1 = __importDefault(require("mongoose"));
const order_model_1 = __importDefault(require("../models/order.model"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const payos_1 = __importDefault(require("../utils/payos"));
const getTripCommissionRates = async () => {
    const SystemConfig = require('../models/systemConfig.model').default;
    const configs = await SystemConfig.find({ key: { $in: ['commission_trip_creator_percent', 'commission_trip_admin_percent'] } });
    const configMap = {};
    configs.forEach((c) => { configMap[c.key] = c.value; });
    return {
        creatorPercent: (configMap['commission_trip_creator_percent'] ?? 70) / 100,
        adminPercent: (configMap['commission_trip_admin_percent'] ?? 30) / 100,
    };
};
const CREATOR_SHARE_RATIO = 0.7;
const resolveReviewTargetTripId = (trip) => {
    if (trip?.isPurchasedClone && trip?.originalTripId) {
        return String(trip.originalTripId);
    }
    return String(trip?._id);
};
const syncItineraryReviewStats = async (targetTripId) => {
    const stats = await review_model_1.default.aggregate([
        { $match: { targetId: targetTripId, targetType: "itinerary" } },
        {
            $group: {
                _id: "$targetId",
                avgScore: { $avg: "$rating" },
                count: { $sum: 1 }
            }
        }
    ]);
    const avgScore = stats.length > 0 ? Number(stats[0].avgScore.toFixed(1)) : 0;
    const totalReviews = stats.length > 0 ? stats[0].count : 0;
    await trip_model_1.default.findByIdAndUpdate(targetTripId, {
        averageRating: avgScore,
        totalReviews
    });
};
const publishToMarketplace = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const tripId = req.params.tripId;
        const { price } = req.body;
        if (!userId)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const trip = await trip_model_1.default.findOne({ _id: tripId });
        if (!trip)
            return res.status(404).json({ success: false, message: "Không tìm thấy lịch trình" });
        if (trip.userId !== userId) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền bán lịch trình của người khác." });
        }
        const user = await user_model_1.default.findOne({ userId });
        const now = new Date();
        if (!user || user.role !== 'creator' || !user.creatorSubscriptionEndsAt || user.creatorSubscriptionEndsAt < now) {
            return res.status(403).json({
                success: false,
                message: "Bạn cần đăng ký hoặc gia hạn gói Creator để được phép bán lịch trình trên Marketplace!",
                code: "CREATOR_REQUIRED"
            });
        }
        // Anti-Resell Rule
        if (trip.isPurchasedClone) {
            return res.status(403).json({ success: false, message: "Bạn không được phép bán lại lịch trình đã mua (Vi phạm bản quyền)." });
        }
        // Anti-Duplicate-Sell Rule (Allow Price Update)
        if (trip.isForSale) {
            trip.price = price || 0;
            await trip.save();
            return res.json({ success: true, message: "Cập nhật giá bán thành công", trip });
        }
        trip.isPublished = true;
        trip.isForSale = true;
        trip.price = price || 0;
        await trip.save();
        return res.json({ success: true, message: "Trip published to marketplace successfully", trip });
    }
    catch (error) {
        console.error("Publish to marketplace error:", error);
        return res.status(500).json({ success: false, message: "Publish to marketplace failed" });
    }
};
exports.publishToMarketplace = publishToMarketplace;
const createPaymentUrl = async (req, res) => {
    try {
        const buyerId = req.user?.userId;
        const { tripId } = req.params;
        if (!buyerId)
            return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
        const templateTrip = await trip_model_1.default.findById(tripId);
        if (!templateTrip)
            return res.status(404).json({ success: false, message: "Trip template not found" });
        if (templateTrip.userId === buyerId) {
            return res.json({
                success: true,
                message: "Bạn đã sở hữu lịch trình này",
                tripId: templateTrip._id,
                alreadyOwned: true,
                paymentRequired: false
            });
            return res.json({ success: true, message: "Bạn đã sở hữu lịch trình này!", tripId: templateTrip._id });
        }
        // Check if buyer has already purchased a clone of this trip
        const existingPurchase = await trip_model_1.default.findOne({
            userId: buyerId,
            originalTripId: templateTrip._id,
            isPurchasedClone: true
        });
        if (existingPurchase) {
            return res.json({
                success: true,
                message: "Bạn đã sở hữu lịch trình này",
                tripId: existingPurchase._id,
                alreadyOwned: true,
                paymentRequired: false
            });
            return res.json({
                success: true,
                message: "Bạn đã sở hữu lịch trình này!",
                tripId: existingPurchase._id
            });
        }
        const price = templateTrip.price || 0;
        // Generate unique order code
        const orderCode = Math.floor(Math.random() * 1000000) + new Date().getTime() % 1000000;
        // Create PENDING Order
        const order = new order_model_1.default({
            orderCode,
            buyerId,
            sellerId: templateTrip.userId,
            tripTemplateId: templateTrip._id,
            amount: price,
            status: 'PENDING'
        });
        await order.save();
        // If it's free, unlock instantly
        if (price === 0) {
            await (0, exports.processTripOrder)(orderCode);
            const clonedTrip = await trip_model_1.default.findOne({
                originalTripId: templateTrip._id,
                userId: buyerId,
                isPurchasedClone: true
            }).sort({ createdAt: -1 });
            return res.json({
                success: true,
                message: "Lịch trình miễn phí. Mở khoá thành công!",
                paymentMethod: 'free',
                tripId: clonedTrip?._id,
                newTripId: clonedTrip?._id,
                alreadyOwned: false,
                paymentRequired: false
            });
        }
        // ── ƯU TIÊN: Kiểm tra số dư ví của buyer ──
        const buyer = await user_model_1.default.findOne({ userId: buyerId });
        if (buyer && buyer.balance >= price) {
            // Đủ số dư → Thanh toán bằng số dư, chia tiền luôn
            const session = await mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const tripRates = await getTripCommissionRates();
                const creatorAmount = Math.floor(price * tripRates.creatorPercent);
                const adminAmount = price - creatorAmount;
                // Trừ tiền buyer
                await user_model_1.default.findOneAndUpdate({ userId: buyerId }, { $inc: { balance: -price } }, { session });
                // Cộng tiền creator (70%)
                await user_model_1.default.findOneAndUpdate({ userId: templateTrip.userId }, { $inc: { balance: creatorAmount } }, { new: true, session });
                // Cộng tiền admin (30%)
                await wallet_model_1.default.findOneAndUpdate({ isSystem: true }, {
                    $inc: { balance: adminAmount },
                    $setOnInsert: { isSystem: true, currency: "VND" }
                }, { new: true, upsert: true, session });
                // Clone lịch trình cho buyer
                let clonedTripId = null;
                const clonedTripData = {
                    userId: buyerId,
                    title: `${templateTrip.title} (Đã mua)`,
                    destination: templateTrip.destination,
                    province: templateTrip.province,
                    provinceImage: templateTrip.provinceImage,
                    startDate: templateTrip.startDate,
                    endDate: templateTrip.endDate,
                    totalDays: templateTrip.totalDays,
                    description: templateTrip.description || "",
                    isPublished: false,
                    isForSale: false,
                    isPurchasedClone: true,
                    originalTripId: templateTrip._id,
                    originalCreatorId: templateTrip.userId,
                    price: 0
                };
                const newTrip = new trip_model_1.default(clonedTripData);
                await newTrip.save({ session });
                clonedTripId = newTrip._id;
                const templateDays = await planDay_model_1.default.find({ tripId: templateTrip._id }).session(session).sort({ dayNumber: 1 });
                for (const day of templateDays) {
                    const clonedDay = new planDay_model_1.default({ tripId: newTrip._id, dayNumber: day.dayNumber, date: day.date });
                    await clonedDay.save({ session });
                    const templatePlaces = await planPlace_model_1.default.find({ dayId: day._id }).session(session).sort({ order: 1 });
                    for (const place of templatePlaces) {
                        const clonedPlace = new planPlace_model_1.default({
                            dayId: clonedDay._id,
                            placeId: place.placeId,
                            name: place.name,
                            address: place.address,
                            photo: place.photo,
                            latitude: place.latitude,
                            longitude: place.longitude,
                            rating: place.rating,
                            mapUrl: place.mapUrl,
                            order: place.order,
                            timeOfDay: place.timeOfDay || "morning"
                        });
                        await clonedPlace.save({ session });
                    }
                }
                await trip_model_1.default.findByIdAndUpdate(templateTrip._id, { $inc: { soldCount: 1 } }, { session });
                // Cập nhật order thành công
                order.status = 'SUCCESS';
                order.providerTransactionId = 'BALANCE_PAYMENT';
                await order.save({ session });
                // Gửi thông báo
                const sellerNotification = new notification_model_1.default({
                    userId: templateTrip.userId,
                    title: "Bạn vừa bán được một Plan",
                    message: `Plan "${templateTrip.title}" đã được mua thành công. Bạn nhận ${creatorAmount.toLocaleString('vi-VN')}đ.`
                });
                await sellerNotification.save({ session });
                const buyerNotification = new notification_model_1.default({
                    userId: buyerId,
                    title: "Mua Plan thành công",
                    message: `Bạn đã mua thành công plan "${templateTrip.title}" bằng số dư ví.`
                });
                await buyerNotification.save({ session });
                await session.commitTransaction();
                session.endSession();
                return res.json({
                    success: true,
                    message: "Mua lịch trình thành công bằng số dư ví!",
                    paymentMethod: 'balance',
                    tripId: clonedTripId,
                    newTripId: clonedTripId,
                    alreadyOwned: false,
                    paymentRequired: false,
                    orderCode
                });
            }
            catch (err) {
                await session.abortTransaction();
                session.endSession();
                console.error("Balance payment for trip error:", err);
                return res.status(500).json({ success: false, message: "Thanh toán bằng số dư thất bại" });
            }
        }
        // ── DỰ PHÒNG: Số dư không đủ → Tạo link PayOS ──
        const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://192.168.1.3:8081';
        const body = {
            orderCode,
            amount: price,
            description: `Mua plan ${templateTrip.title}`.slice(0, 25),
            returnUrl: `${YOUR_DOMAIN}/payment/success?orderCode=${orderCode}`,
            cancelUrl: `${YOUR_DOMAIN}/payment/cancel?orderCode=${orderCode}`,
            items: [
                {
                    name: templateTrip.title.slice(0, 50),
                    quantity: 1,
                    price: price,
                },
            ],
        };
        const paymentLinkRes = await payos_1.default.paymentRequests.create(body);
        order.providerTransactionId = paymentLinkRes.checkoutUrl;
        await order.save();
        return res.json({
            success: true,
            message: "Số dư không đủ. Đang chuyển hướng tới cổng thanh toán...",
            paymentMethod: 'payos',
            paymentRequired: true,
            checkoutUrl: paymentLinkRes.checkoutUrl,
            paymentUrl: paymentLinkRes.checkoutUrl,
            orderCode
        });
    }
    catch (error) {
        console.error("Create Payment URL error:", error);
        return res.status(500).json({ success: false, message: "Create payment failed" });
    }
};
exports.createPaymentUrl = createPaymentUrl;
const handlePaymentWebhook = async (req, res) => {
    try {
        // Verify Webhook using PayOS SDK
        const webhookData = await payos_1.default.webhooks.verify(req.body);
        // Always acknowledge the webhook to prevent retries
        res.status(200).json({ success: true, message: "Webhook processed" });
        if (['Ma giao dich thu nghiem', 'VQRIO123'].includes(webhookData.description)) {
            return;
        }
        if (webhookData.code !== '00')
            return; // Not a successful payment
        const { orderCode } = webhookData;
        await (0, exports.processTripOrder)(orderCode);
        return;
    }
    catch (error) {
        console.error("Webhook processing error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Webhook error" });
        }
    }
};
exports.handlePaymentWebhook = handlePaymentWebhook;
const processTripOrder = async (orderCode) => {
    const transactionId = "PAYOS_TXN";
    // Ensure collections exist before transaction to prevent MongoServerError
    try {
        await wallet_model_1.default.createCollection();
        await trip_model_1.default.createCollection();
        await planDay_model_1.default.createCollection();
        await planPlace_model_1.default.createCollection();
        await notification_model_1.default.createCollection();
    }
    catch (e) {
        // Ignore collection already exists error
    }
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const order = await order_model_1.default.findOne({ orderCode }).session(session);
        if (!order || order.status === 'SUCCESS') {
            await session.abortTransaction();
            session.endSession();
            return;
        }
        const tripRates = await getTripCommissionRates();
        const creatorAmount = Math.floor(order.amount * tripRates.creatorPercent);
        const adminAmount = order.amount - creatorAmount;
        // Revenue split: 70% for creator, 30% for admin system wallet.
        await user_model_1.default.findOneAndUpdate({ userId: order.sellerId }, { $inc: { balance: creatorAmount } }, { new: true, session });
        await wallet_model_1.default.findOneAndUpdate({ isSystem: true }, {
            $inc: { balance: adminAmount },
            $setOnInsert: { isSystem: true, currency: "VND" }
        }, { new: true, upsert: true, session });
        let templateTripTitle = "lịch trình";
        // Clone Trip (Unlock)
        const templateTrip = await trip_model_1.default.findById(order.tripTemplateId).session(session);
        if (templateTrip) {
            templateTripTitle = templateTrip.title;
            const clonedTripData = {
                userId: order.buyerId,
                title: `${templateTrip.title} (Đã mua)`,
                destination: templateTrip.destination,
                province: templateTrip.province,
                provinceImage: templateTrip.provinceImage,
                startDate: templateTrip.startDate,
                endDate: templateTrip.endDate,
                totalDays: templateTrip.totalDays,
                description: templateTrip.description || "",
                isPublished: false,
                isForSale: false,
                isPurchasedClone: true,
                originalTripId: templateTrip._id,
                originalCreatorId: templateTrip.userId,
                price: 0
            };
            const newTrip = new trip_model_1.default(clonedTripData);
            await newTrip.save({ session });
            const templateDays = await planDay_model_1.default.find({ tripId: templateTrip._id }).session(session).sort({ dayNumber: 1 });
            for (const day of templateDays) {
                const clonedDay = new planDay_model_1.default({ tripId: newTrip._id, dayNumber: day.dayNumber, date: day.date });
                await clonedDay.save({ session });
                const templatePlaces = await planPlace_model_1.default.find({ dayId: day._id }).session(session).sort({ order: 1 });
                for (const place of templatePlaces) {
                    const clonedPlace = new planPlace_model_1.default({
                        dayId: clonedDay._id,
                        placeId: place.placeId,
                        name: place.name,
                        address: place.address,
                        photo: place.photo,
                        latitude: place.latitude,
                        longitude: place.longitude,
                        rating: place.rating,
                        mapUrl: place.mapUrl,
                        order: place.order,
                        timeOfDay: place.timeOfDay || "morning"
                    });
                    await clonedPlace.save({ session });
                }
            }
            await trip_model_1.default.findByIdAndUpdate(templateTrip._id, { $inc: { soldCount: 1 } }, { session });
        }
        order.status = 'SUCCESS';
        order.providerTransactionId = transactionId || "SANDBOX_TXN";
        await order.save({ session });
        const sellerNotification = new notification_model_1.default({
            userId: order.sellerId,
            title: "Bạn vừa bán được một Plan",
            message: `Plan "${templateTripTitle}" đã được mua thành công. Bạn nhận ${creatorAmount.toLocaleString('vi-VN')}đ.`
        });
        await sellerNotification.save({ session });
        const buyerNotification = new notification_model_1.default({
            userId: order.buyerId,
            title: "Mua Plan thành công",
            message: `Bạn đã mua thành công plan "${templateTripTitle}".`
        });
        await buyerNotification.save({ session });
        await session.commitTransaction();
        session.endSession();
        console.log(`[Webhook] Mở khoá thành công cho Order ${orderCode}`);
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Process trip order error:", error);
        throw error;
    }
};
exports.processTripOrder = processTripOrder;
const renderSandboxPayment = async (req, res) => {
    const { orderCode } = req.params;
    const autoSubmit = req.query.auto === 'true';
    const html = `
    <html>
      <head>
        <title>Thanh toán Sandbox (Mô phỏng VNPAY/PayOS)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; background: #FAFBFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
          .title { color: #1A2B4A; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
          .subtitle { color: #718096; margin-bottom: 24px; font-size: 14px; }
          .btn { background: #4A7CFF; color: white; border: none; padding: 14px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s; }
          .btn:active { background: #3164F4; }
          .btn-success { background: #38A169; }
        </style>
      </head>
      <body>
        <div class="card" id="card">
          <div class="title">Thanh toán Giao dịch #${orderCode}</div>
          <div class="subtitle">Đóng vai trò là Cổng thanh toán thật (PayOS/VNPAY). Bấm để giả lập khách hàng chuyển khoản thành công.</div>
          <button class="btn" id="payBtn" onclick="pay()">Xác nhận thanh toán (Mô phỏng)</button>
        </div>
        <script>
          async function pay() {
            document.getElementById('payBtn').innerText = 'Đang xử lý...';
            const res = await fetch('/api/trips/payment-webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderCode: ${orderCode}, status: 'PAID', transactionId: 'MOCK_' + new Date().getTime() })
            });
            if (res.ok) {
              document.getElementById('card').innerHTML = '<div class="title" style="color: #38A169;">Thanh toán thành công!</div><div class="subtitle">Hệ thống đã cập nhật ví và mở khoá lịch trình. Vui lòng quay lại ứng dụng.</div>';
            }
          }
          ${autoSubmit ? 'setTimeout(pay, 500);' : ''}
        </script>
      </body>
    </html>
  `;
    res.send(html);
};
exports.renderSandboxPayment = renderSandboxPayment;
const getTripSalesStats = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const tripId = req.params.tripId;
        if (!userId)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const trip = await trip_model_1.default.findOne({ _id: tripId, userId });
        if (!trip)
            return res.status(404).json({ success: false, message: "Trip not found or unauthorized" });
        const stats = await order_model_1.default.aggregate([
            { $match: { tripTemplateId: new mongoose_1.default.Types.ObjectId(tripId), status: 'SUCCESS' } },
            {
                $group: {
                    _id: null,
                    grossRevenue: { $sum: "$amount" },
                    creatorRevenue: { $sum: { $floor: { $multiply: ["$amount", CREATOR_SHARE_RATIO] } } },
                    totalSales: { $sum: 1 }
                }
            }
        ]);
        const result = stats.length > 0 ? stats[0] : { grossRevenue: 0, creatorRevenue: 0, totalSales: 0 };
        res.json({
            success: true,
            totalSales: result.totalSales,
            totalRevenue: result.creatorRevenue,
            grossRevenue: result.grossRevenue
        });
    }
    catch (error) {
        console.error("Get trip sales stats error:", error);
        res.status(500).json({ success: false, message: "Get stats failed" });
    }
};
exports.getTripSalesStats = getTripSalesStats;
const submitItineraryReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { tripId } = req.params;
        const { rating, comment } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const numericRating = Number(rating);
        if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 10) {
            return res.status(400).json({ success: false, message: "Điểm đánh giá phải từ 1 đến 10" });
        }
        if (!comment || !String(comment).trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung feedback" });
        }
        const trip = await trip_model_1.default.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, message: "Trip not found" });
        }
        const reviewTargetTripId = resolveReviewTargetTripId(trip);
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewTargetTripId)) {
            return res.status(400).json({
                success: false,
                message: "Trip không hợp lệ"
            });
        }
        const reviewTargetObjectId = new mongoose_1.default.Types.ObjectId(reviewTargetTripId);
        const purchasedOrders = await order_model_1.default.aggregate([
            {
                $match: {
                    buyerId: userId,
                    tripTemplateId: reviewTargetObjectId,
                    status: "SUCCESS"
                }
            },
            { $limit: 1 },
            { $project: { _id: 1 } }
        ]);
        const hasPurchased = purchasedOrders.length > 0;
        if (!hasPurchased) {
            return res.status(403).json({
                success: false,
                message: "Bạn cần mua lịch trình này trước khi gửi feedback"
            });
        }
        let review = await review_model_1.default.findOne({
            userId,
            targetId: reviewTargetTripId,
            targetType: "itinerary"
        });
        if (review) {
            review.rating = numericRating;
            review.comment = String(comment).trim();
            await review.save();
        }
        else {
            review = await review_model_1.default.create({
                userId,
                targetId: reviewTargetTripId,
                targetType: "itinerary",
                rating: numericRating,
                comment: String(comment).trim()
            });
        }
        await syncItineraryReviewStats(reviewTargetTripId);
        const templateTrip = await trip_model_1.default.findById(reviewTargetTripId).select("title userId");
        if (templateTrip && templateTrip.userId !== userId) {
            await notification_model_1.default.create({
                userId: templateTrip.userId,
                title: "Plan của bạn có feedback mới",
                message: `Lịch trình \"${templateTrip.title}\" vừa nhận được đánh giá ${numericRating}/10.`
            });
        }
        return res.status(200).json({
            success: true,
            message: "Gửi feedback thành công",
            data: review
        });
    }
    catch (error) {
        console.error("Submit itinerary review error:", error);
        return res.status(500).json({ success: false, message: "Không thể gửi feedback" });
    }
};
exports.submitItineraryReview = submitItineraryReview;
const getMyItineraryReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { tripId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const trip = await trip_model_1.default.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, message: "Trip not found" });
        }
        const reviewTargetTripId = resolveReviewTargetTripId(trip);
        const review = await review_model_1.default.findOne({
            userId,
            targetId: reviewTargetTripId,
            targetType: "itinerary"
        });
        return res.status(200).json({ success: true, data: review });
    }
    catch (error) {
        console.error("Get my itinerary review error:", error);
        return res.status(500).json({ success: false, message: "Không thể tải feedback" });
    }
};
exports.getMyItineraryReview = getMyItineraryReview;
const deleteItineraryReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { tripId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const trip = await trip_model_1.default.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, message: "Trip not found" });
        }
        const reviewTargetTripId = resolveReviewTargetTripId(trip);
        const result = await review_model_1.default.findOneAndDelete({
            userId,
            targetId: reviewTargetTripId,
            targetType: "itinerary"
        });
        if (result) {
            await syncItineraryReviewStats(reviewTargetTripId);
        }
        return res.status(200).json({ success: true, message: "Đã xóa đánh giá" });
    }
    catch (error) {
        console.error("Delete itinerary review error:", error);
        return res.status(500).json({ success: false, message: "Không thể xóa feedback" });
    }
};
exports.deleteItineraryReview = deleteItineraryReview;
