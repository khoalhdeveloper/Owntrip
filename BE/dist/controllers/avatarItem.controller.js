"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarItemController = void 0;
const avatarItem_model_1 = __importDefault(require("../models/avatarItem.model"));
exports.AvatarItemController = {
    // GET /api/avatar-items  — Lấy toàn bộ (Admin) hoặc chỉ active (Public)
    getAll: async (req, res) => {
        try {
            const { type, rarity } = req.query;
            const filter = {};
            if (type)
                filter.type = type;
            if (rarity)
                filter.rarity = rarity;
            const items = await avatarItem_model_1.default.find(filter).sort({ createdAt: -1 });
            res.json({ success: true, data: items });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // GET /api/avatar-items/shop — Chỉ các item đang active (cho người dùng mua)
    getShopItems: async (req, res) => {
        try {
            const { type } = req.query;
            const filter = { isActive: true };
            if (type)
                filter.type = type;
            const items = await avatarItem_model_1.default.find(filter).sort({ createdAt: -1 });
            res.json({ success: true, data: items });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // POST /api/avatar-items — Tạo item mới (Admin)
    create: async (req, res) => {
        try {
            console.log('Incoming AvatarItem data:', req.body);
            const { name, type, imageUrl, previewUrl, price, rarity, description, isActive } = req.body;
            if (!name || !type || !imageUrl || price === undefined) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc: name, type, imageUrl, price' });
            }
            const item = new avatarItem_model_1.default({ name, type, imageUrl, previewUrl, price, rarity, description, isActive });
            await item.save();
            console.log('Saved successfully:', item.itemId);
            res.status(201).json({ success: true, message: 'Tạo item thành công', data: item });
        }
        catch (error) {
            console.error('Save AvatarItem error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // PUT /api/avatar-items/:id — Cập nhật item (Admin)
    update: async (req, res) => {
        try {
            const item = await avatarItem_model_1.default.findOneAndUpdate({ itemId: req.params.id }, { $set: req.body }, { new: true });
            if (!item)
                return res.status(404).json({ success: false, message: 'Không tìm thấy item' });
            res.json({ success: true, message: 'Cập nhật thành công', data: item });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // DELETE /api/avatar-items/:id — Xóa item (Admin)
    delete: async (req, res) => {
        try {
            const item = await avatarItem_model_1.default.findOneAndDelete({ itemId: req.params.id });
            if (!item)
                return res.status(404).json({ success: false, message: 'Không tìm thấy item' });
            res.json({ success: true, message: 'Đã xóa item thành công' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // PATCH /api/avatar-items/:id/toggle — Bật/tắt trạng thái bán (Admin)
    toggleActive: async (req, res) => {
        try {
            const item = await avatarItem_model_1.default.findOne({ itemId: req.params.id });
            if (!item)
                return res.status(404).json({ success: false, message: 'Không tìm thấy item' });
            item.isActive = !item.isActive;
            await item.save();
            res.json({ success: true, message: `Đã ${item.isActive ? 'kích hoạt' : 'ẩn'} item`, data: item });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
