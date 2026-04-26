"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const idGenerator_1 = require("../utils/idGenerator");
const hotelSchema = new mongoose_1.Schema({
    hotelId: { type: String, unique: true },
    name: { type: String, required: true },
    starRating: { type: Number, default: 4 },
    address: {
        fullAddress: String,
        city: String,
        coordinates: { lat: Number, lng: Number }
    },
    images: [String],
    description: String,
    amenities: [String],
    tags: [String],
    rooms: [{
            roomTypeId: String,
            name: String,
            description: String,
            basePrice: Number,
            price: Number,
            capacity: Number,
            images: [String],
            amenities: [String]
        }],
    reviewSummary: {
        score: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        cleanliness: { type: Number, default: 0 },
        service: { type: Number, default: 0 },
        facilities: { type: Number, default: 0 },
        valueForMoney: { type: Number, default: 0 }
    },
    ownerId: {
        type: String,
        ref: "User",
        index: true
    }
}, { timestamps: true, versionKey: false });
hotelSchema.pre('save', async function () {
    if (this.isNew) {
        this.hotelId = await (0, idGenerator_1.generateCustomId)((0, mongoose_1.model)('Hotel'), 'HotelId', 'hotelId');
    }
});
exports.default = (0, mongoose_1.model)('Hotel', hotelSchema);
