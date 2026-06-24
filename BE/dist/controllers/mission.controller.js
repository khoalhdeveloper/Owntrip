"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimReward = exports.getMyMissionProgress = exports.toggleMissionActiveAdmin = exports.deleteMissionAdmin = exports.updateMissionAdmin = exports.createMissionAdmin = exports.getAllMissionsAdmin = exports.getMissions = void 0;
const mission_model_1 = __importDefault(require("../models/mission.model"));
const userMissionProgress_model_1 = __importDefault(require("../models/userMissionProgress.model"));
const missionProgress_service_1 = require("../services/missionProgress.service");
const missionAdmin_service_1 = require("../services/missionAdmin.service");
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
const getMissions = async (_req, res) => {
    try {
        const missions = await mission_model_1.default.find(activeMissionFilter()).sort({ order: 1 });
        return res.json({
            success: true,
            total: missions.length,
            missions
        });
    }
    catch (error) {
        console.error("Get missions error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the lay danh sach nhiem vu",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getMissions = getMissions;
const getAllMissionsAdmin = async (_req, res) => {
    try {
        const missions = await mission_model_1.default.find().sort({ order: 1, createdAt: -1 });
        return res.json({
            success: true,
            total: missions.length,
            missions
        });
    }
    catch (error) {
        console.error("Get admin missions error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the lay danh sach nhiem vu admin",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getAllMissionsAdmin = getAllMissionsAdmin;
const createMissionAdmin = async (req, res) => {
    try {
        const payload = (0, missionAdmin_service_1.buildMissionPayload)(req.body);
        const mission = await mission_model_1.default.create(payload);
        return res.status(201).json({
            success: true,
            message: "Tao nhiem vu thanh cong",
            mission
        });
    }
    catch (error) {
        const status = error instanceof missionAdmin_service_1.MissionAdminValidationError ? error.status : 500;
        return res.status(status).json({
            success: false,
            code: error instanceof missionAdmin_service_1.MissionAdminValidationError ? error.code : "create_mission_failed",
            message: error instanceof Error ? error.message : "Khong the tao nhiem vu"
        });
    }
};
exports.createMissionAdmin = createMissionAdmin;
const updateMissionAdmin = async (req, res) => {
    try {
        const payload = (0, missionAdmin_service_1.buildMissionPayload)(req.body, true);
        const mission = await mission_model_1.default.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true, runValidators: true });
        if (!mission) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay nhiem vu"
            });
        }
        return res.json({
            success: true,
            message: "Cap nhat nhiem vu thanh cong",
            mission
        });
    }
    catch (error) {
        const status = error instanceof missionAdmin_service_1.MissionAdminValidationError ? error.status : 500;
        return res.status(status).json({
            success: false,
            code: error instanceof missionAdmin_service_1.MissionAdminValidationError ? error.code : "update_mission_failed",
            message: error instanceof Error ? error.message : "Khong the cap nhat nhiem vu"
        });
    }
};
exports.updateMissionAdmin = updateMissionAdmin;
const deleteMissionAdmin = async (req, res) => {
    try {
        const mission = await mission_model_1.default.findByIdAndDelete(req.params.id);
        if (!mission) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay nhiem vu"
            });
        }
        return res.json({
            success: true,
            message: "Da xoa nhiem vu thanh cong"
        });
    }
    catch (error) {
        console.error("Delete mission error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the xoa nhiem vu",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.deleteMissionAdmin = deleteMissionAdmin;
const toggleMissionActiveAdmin = async (req, res) => {
    try {
        const mission = await mission_model_1.default.findById(req.params.id);
        if (!mission) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay nhiem vu"
            });
        }
        mission.isActive = !mission.isActive;
        await mission.save();
        return res.json({
            success: true,
            message: mission.isActive ? "Da kich hoat nhiem vu" : "Da an nhiem vu",
            mission
        });
    }
    catch (error) {
        console.error("Toggle mission error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the doi trang thai nhiem vu",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.toggleMissionActiveAdmin = toggleMissionActiveAdmin;
const getMyMissionProgress = async (req, res) => {
    try {
        const userId = req.user?.userId;
        console.log("[DEBUG getMyMissionProgress] Request userId:", userId);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const filter = activeMissionFilter();
        console.log("[DEBUG getMyMissionProgress] Active Mission Filter:", JSON.stringify(filter));
        const missions = await mission_model_1.default.find(filter).sort({ order: 1 });
        console.log("[DEBUG getMyMissionProgress] Found missions count:", missions.length);
        const missionIds = missions.map((mission) => mission._id);
        const progresses = await userMissionProgress_model_1.default.find({
            userId,
            missionId: { $in: missionIds }
        });
        console.log("[DEBUG getMyMissionProgress] Found user progress count:", progresses.length);
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
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return res.json({
            success: true,
            total: items.length,
            missions: items
        });
    }
    catch (error) {
        console.error("Get my mission progress error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the lay tien do nhiem vu",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getMyMissionProgress = getMyMissionProgress;
const claimReward = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const result = await (0, missionProgress_service_1.claimMissionReward)({
            userId,
            missionId: String(req.params.id)
        });
        if (result.status === "not_found") {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay nhiem vu"
            });
        }
        if (result.status === "not_completed") {
            return res.status(400).json({
                success: false,
                message: "Nhiem vu chua hoan thanh"
            });
        }
        return res.json({
            success: true,
            status: result.status,
            reward: result.reward,
            progress: result.progress
        });
    }
    catch (error) {
        console.error("Claim mission reward error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the nhan thuong nhiem vu",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.claimReward = claimReward;
