"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const topupTransactionSchema = new mongoose_1.Schema({
    txnRef: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    pointsEarned: { type: Number, required: true },
    responseCode: { type: String, required: true },
    source: { type: String, enum: ['ipn', 'return'], required: true },
    status: { type: String, enum: ['success', 'failed'], required: true }
}, { timestamps: true, versionKey: false });
exports.default = (0, mongoose_1.model)('TopupTransaction', topupTransactionSchema);
