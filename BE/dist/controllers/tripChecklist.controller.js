"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTripChecklist = exports.getTripChecklist = void 0;
const trip_model_1 = __importDefault(require("../models/trip.model"));
const tripChecklist_model_1 = __importDefault(require("../models/tripChecklist.model"));
const assertTripOwner = async (tripId, userId) => {
    const trip = await trip_model_1.default.findOne({ _id: tripId, userId });
    return Boolean(trip);
};
const normalizeItems = (items) => {
    return items.map((item) => ({
        id: String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        title: String(item.title || "").trim(),
        category: item.category || "other",
        checked: Boolean(item.checked)
    })).filter((item) => item.title.length > 0);
};
const getTripChecklist = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const tripId = String(req.params.tripId);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
        }
        if (!(await assertTripOwner(tripId, userId))) {
            return res.status(403).json({
                success: false,
                message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
            });
        }
        const checklist = await tripChecklist_model_1.default.findOne({ tripId, userId });
        return res.json({
            success: true,
            checklist: checklist || { tripId, userId, items: [] }
        });
    }
    catch (error) {
        console.error("Get checklist error:", error);
        return res.status(500).json({ success: false, message: "Không thể tải checklist" });
    }
};
exports.getTripChecklist = getTripChecklist;
const updateTripChecklist = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const tripId = String(req.params.tripId);
        const { items } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
        }
        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, message: "items phải là một mảng" });
        }
        if (!(await assertTripOwner(tripId, userId))) {
            return res.status(403).json({
                success: false,
                message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
            });
        }
        const checklist = await tripChecklist_model_1.default.findOneAndUpdate({ tripId, userId }, { $set: { items: normalizeItems(items) } }, { new: true, upsert: true, runValidators: true });
        return res.json({
            success: true,
            message: "Cập nhật checklist thành công",
            checklist
        });
    }
    catch (error) {
        console.error("Update checklist error:", error);
        return res.status(500).json({ success: false, message: "Không thể cập nhật checklist" });
    }
};
exports.updateTripChecklist = updateTripChecklist;
