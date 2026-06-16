"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimMissionReward = exports.recordMissionCheckin = exports.grantMissionReward = void 0;
const mission_model_1 = __importDefault(require("../models/mission.model"));
const userMissionProgress_model_1 = __importDefault(require("../models/userMissionProgress.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const checkinFrameReward_service_1 = require("./checkinFrameReward.service");
const now = () => new Date();
const activeMissionFilterForPlace = (placeId) => {
    const currentDate = now();
    return {
        isActive: true,
        requiredPlaceIds: placeId,
        $and: [
            { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: currentDate } }] },
            { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: currentDate } }] }
        ]
    };
};
const isMissionCompleted = (mission, checkedPlaceIds) => {
    const checked = new Set(checkedPlaceIds);
    return mission.requiredPlaceIds.every((requiredPlaceId) => checked.has(requiredPlaceId));
};
const grantMissionReward = async ({ userId, mission }) => {
    const reward = mission.reward;
    if (reward.type === "checkin_frame") {
        if (!reward.frameId) {
            throw new Error("Mission reward frameId is required");
        }
        return (0, checkinFrameReward_service_1.grantCheckinFrameReward)({
            userId,
            frameId: String(reward.frameId)
        });
    }
    if (reward.type === "points") {
        const pointsAmount = Number(reward.pointsAmount || 0);
        if (pointsAmount > 0) {
            await user_model_1.default.updateOne({ userId }, { $inc: { points: pointsAmount } });
        }
        return {
            type: "points",
            pointsAmount,
            granted: pointsAmount > 0
        };
    }
    return {
        type: reward.type,
        souvenirId: reward.souvenirId,
        granted: true
    };
};
exports.grantMissionReward = grantMissionReward;
const recordMissionCheckin = async ({ userId, placeId, MissionModel = mission_model_1.default, ProgressModel = userMissionProgress_model_1.default, grantReward = exports.grantMissionReward }) => {
    const missions = await MissionModel.find(activeMissionFilterForPlace(placeId)).sort({ order: 1 });
    const updatedProgress = [];
    const rewards = [];
    for (const mission of missions) {
        let progress = await ProgressModel.findOne({
            userId,
            missionId: mission._id
        });
        if (!progress) {
            progress = await ProgressModel.create({
                userId,
                missionId: mission._id,
                checkedPlaceIds: []
            });
        }
        if (!progress.checkedPlaceIds.includes(placeId)) {
            progress.checkedPlaceIds.push(placeId);
        }
        if (!progress.completedAt && isMissionCompleted(mission, progress.checkedPlaceIds)) {
            progress.completedAt = now();
        }
        if (progress.completedAt && !progress.rewardGrantedAt) {
            const rewardResult = await grantReward({ userId, mission });
            progress.rewardGrantedAt = now();
            progress.rewardClaimedAt = progress.rewardClaimedAt || progress.rewardGrantedAt;
            progress.rewardResult = rewardResult;
            rewards.push(rewardResult);
        }
        await progress.save();
        updatedProgress.push(progress);
    }
    return {
        missionProgress: updatedProgress,
        rewards
    };
};
exports.recordMissionCheckin = recordMissionCheckin;
const claimMissionReward = async ({ userId, missionId, MissionModel = mission_model_1.default, ProgressModel = userMissionProgress_model_1.default, grantReward = exports.grantMissionReward }) => {
    if (!MissionModel.findById) {
        throw new Error("MissionModel.findById is required");
    }
    const mission = await MissionModel.findById(missionId);
    if (!mission || !mission.isActive) {
        return { status: "not_found" };
    }
    const progress = await ProgressModel.findOne({ userId, missionId: mission._id });
    if (!progress || !progress.completedAt) {
        return { status: "not_completed" };
    }
    if (progress.rewardGrantedAt) {
        return {
            status: "already_granted",
            progress,
            reward: progress.rewardResult
        };
    }
    const reward = await grantReward({ userId, mission });
    progress.rewardGrantedAt = now();
    progress.rewardClaimedAt = progress.rewardGrantedAt;
    progress.rewardResult = reward;
    await progress.save();
    return {
        status: "granted",
        progress,
        reward
    };
};
exports.claimMissionReward = claimMissionReward;
