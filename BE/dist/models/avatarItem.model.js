"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const idGenerator_1 = require("../utils/idGenerator");
const avatarItemSchema = new mongoose_1.Schema({
    itemId: { type: String, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['frame', 'avatar'], required: true },
    imageUrl: { type: String, required: true },
    previewUrl: { type: String },
    price: { type: Number, required: true, default: 0 },
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
    isActive: { type: Boolean, default: true },
    description: { type: String },
}, { timestamps: true, versionKey: false });
avatarItemSchema.pre('save', async function () {
    if (this.isNew) {
        this.itemId = await (0, idGenerator_1.generateCustomId)((0, mongoose_1.model)('AvatarItem'), 'ItemId', 'itemId');
    }
});
exports.default = (0, mongoose_1.model)('AvatarItem', avatarItemSchema);
