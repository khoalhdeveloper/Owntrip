"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const roomInventorySchema = new mongoose_1.Schema({
    hotelId: {
        type: String,
        required: true,
        index: true // Đánh index để tìm kiếm theo khách sạn nhanh hơn
    },
    roomTypeId: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    totalInventory: {
        type: Number,
        required: true,
        min: 0
    },
    bookedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    priceAtDate: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'full', 'maintenance'],
        default: 'available'
    }
}, {
    timestamps: true, versionKey: false
});
roomInventorySchema.index({ hotelId: 1, roomTypeId: 1, date: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)('RoomInventory', roomInventorySchema);
