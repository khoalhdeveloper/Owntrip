"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const mission_model_1 = __importDefault(require("../models/mission.model"));
const userMissionProgress_model_1 = __importDefault(require("../models/userMissionProgress.model"));
dotenv_1.default.config();
const activeMissionFilter = () => {
    const currentDate = new Date();
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
    const userId = "UserId002";
    const missions = await mission_model_1.default.find(activeMissionFilter()).sort({ order: 1 });
    const missionIds = missions.map((mission) => mission._id);
    const progresses = await userMissionProgress_model_1.default.find({
        userId,
        missionId: { $in: missionIds }
    });
    const progressByMissionId = new Map(progresses.map((progress) => [String(progress.missionId), progress]));
    const items = missions.map((mission) => {
        const progress = progressByMissionId.get(String(mission._id));
        const checkedPlaceIds = progress?.checkedPlaceIds || [];
        return {
            mission,
            progress: progress || null,
            checkedPlaceIds,
            requiredCount: mission.requiredPlaceIds.length,
            checkedCount: checkedPlaceIds.length,
            isCompleted: Boolean(progress?.completedAt),
            rewardGranted: Boolean(progress?.rewardGrantedAt),
            reward: progress?.rewardResult || null
        };
    });
    const responseJSON = {
        success: true,
        total: items.length,
        missions: items
    };
    console.log("Mock Response JSON:");
    console.log(JSON.stringify(responseJSON, null, 2));
    await mongoose_1.default.disconnect();
};
run().catch(console.error);
