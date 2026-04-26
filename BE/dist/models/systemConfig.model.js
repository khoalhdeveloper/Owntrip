"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const systemConfigSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose_1.Schema.Types.Mixed, required: true },
    description: { type: String },
}, { timestamps: true, versionKey: false });
exports.default = (0, mongoose_1.model)('SystemConfig', systemConfigSchema);
