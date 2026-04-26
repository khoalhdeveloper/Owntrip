"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const idGenerator_1 = require("../utils/idGenerator");
const bookingSchema = new mongoose_1.Schema({
    bookingId: { type: String, unique: true },
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true // Index để tìm booking của 1 user nhanh
    },
    hotelId: {
        type: String,
        required: true,
        ref: 'Hotel',
        index: true
    },
    roomTypeId: {
        type: String,
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    nights: {
        type: Number,
        required: true,
        min: 1
    },
    roomCount: {
        type: Number,
        required: true,
        min: 1,
        max: 10 // Giới hạn tối đa 10 phòng/lần đặt
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
        default: 'pending'
    },
    guestInfo: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        specialRequests: String
    },
    paymentMethod: {
        type: String,
        enum: ['balance', 'credit_card', 'bank_transfer'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    cancellationReason: String,
    cancelledAt: Date,
    refundAmount: Number
}, {
    timestamps: true,
    versionKey: false
});
// Tự động tạo BookingId00x
bookingSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.bookingId = await (0, idGenerator_1.generateCustomId)((0, mongoose_1.model)('Booking'), 'BookingId', 'bookingId');
    }
});
// Index compound để query booking theo khoảng ngày
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });
exports.default = (0, mongoose_1.model)('Booking', bookingSchema);
