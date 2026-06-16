"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const mission_model_1 = __importDefault(require("../models/mission.model"));
dotenv_1.default.config();
const activeMissionFilter = () => {
    const currentDate = new Date();
    console.log("Current date for query:", currentDate);
    return {
        isActive: true,
        $and: [
            { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: currentDate } }] },
            { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: currentDate } }] }
        ]
    };
};
const run = async () => {
    await mongoose_1.default.connect(process.env.MONGO_URI || "");
    console.log("Connected to MongoDB");
    const filter = activeMissionFilter();
    console.log("Using filter:", JSON.stringify(filter, null, 2));
    const missions = await mission_model_1.default.find(filter).sort({ order: 1 });
    console.log("Active missions returned:", JSON.stringify(missions, null, 2));
    await mongoose_1.default.disconnect();
};
run().catch(console.error);
