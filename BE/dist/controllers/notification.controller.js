"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
exports.NotificationController = {
    // Lấy danh sách notification của user
    async getAll(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const notifications = await notification_model_1.default.find({ userId }).sort({ createdAt: -1 });
            res.json({ success: true, notifications });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi lấy thông báo' });
        }
    },
    // Đánh dấu đã đọc
    async markRead(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            const noti = await notification_model_1.default.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
            if (!noti)
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
            res.json({ success: true, notification: noti });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
        }
    }
};
