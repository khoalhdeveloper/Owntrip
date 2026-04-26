"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const idGenerator_1 = require("../utils/idGenerator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
    userId: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true },
    image: { type: String },
    balance: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin', 'hotel_owner'], default: 'user' },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });
userSchema.pre('save', async function () {
    if (this.isNew) {
        this.userId = await (0, idGenerator_1.generateCustomId)((0, mongoose_1.model)('User'), 'UserId', 'userId');
        if (this.password) {
            this.password = await bcrypt_1.default.hash(this.password, 10);
        }
    }
});
exports.default = (0, mongoose_1.model)('User', userSchema);
