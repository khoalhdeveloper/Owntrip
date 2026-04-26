"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const idGenerator_1 = require("../utils/idGenerator");
const hotel_model_1 = __importDefault(require("./hotel.model"));
const reviewSchema = new mongoose_1.Schema({
    reviewId: { type: String, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    targetId: { type: String, required: true, index: true },
    targetType: {
        type: String,
        enum: ['hotel', 'itinerary'],
        required: true
    },
    rating: { type: Number, required: true, min: 1, max: 10 },
    criteria: {
        cleanliness: { type: Number, default: 0 },
        service: { type: Number, default: 0 },
        facilities: { type: Number, default: 0 },
        valueForMoney: { type: Number, default: 0 }
    },
    comment: { type: String, required: true },
    images: [String]
}, { timestamps: true, versionKey: false });
// Tự động tạo ReviewId00x
reviewSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.reviewId = await (0, idGenerator_1.generateCustomId)((0, mongoose_1.model)('Review'), 'ReviewId', 'reviewId');
    }
});
// Logic tự động tính toán lại điểm Dashboard cho Khách sạn sau khi có Review mới
reviewSchema.post('save', async function () {
    const ReviewModel = (0, mongoose_1.model)('Review');
    // Tính toán trung bình các tiêu chí
    const stats = await ReviewModel.aggregate([
        { $match: { targetId: this.targetId } },
        {
            $group: {
                _id: "$targetId",
                avgScore: { $avg: "$rating" },
                avgClean: { $avg: "$criteria.cleanliness" },
                avgService: { $avg: "$criteria.service" },
                avgFacilities: { $avg: "$criteria.facilities" },
                count: { $sum: 1 }
            }
        }
    ]);
    if (stats.length > 0 && this.targetType === 'hotel') {
        // Cập nhật ngược lại bảng Hotel để hiển thị Dashboard nhanh hơn
        await hotel_model_1.default.findOneAndUpdate({ hotelId: this.targetId }, {
            "reviewSummary.score": stats[0].avgScore,
            "reviewSummary.count": stats[0].count,
            "reviewSummary.cleanliness": stats[0].avgClean,
            "reviewSummary.service": stats[0].avgService,
            "reviewSummary.facilities": stats[0].avgFacilities
        });
    }
});
exports.default = (0, mongoose_1.model)('Review', reviewSchema);
