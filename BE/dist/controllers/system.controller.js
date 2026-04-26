"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const systemConfig_model_1 = __importDefault(require("../models/systemConfig.model"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.SystemController = {
    // GET /api/system/info
    getSystemInfo: async (req, res) => {
        try {
            const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'Connected' : 'Disconnected';
            const uptime = process.uptime();
            res.json({
                success: true,
                data: {
                    appName: 'OwnTrip Admin',
                    version: '1.0.0',
                    dbStatus,
                    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
                    nodeVersion: process.version,
                    platform: process.platform,
                    memoryUsage: process.memoryUsage(),
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // GET /api/system/config
    getConfig: async (req, res) => {
        try {
            const configs = await systemConfig_model_1.default.find();
            // Chuyển mảng thành object cho dễ dùng ở frontend
            const configObj = configs.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            // Nếu chưa có config nào, trả về mặc định
            if (configs.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        points_per_vnpay_1000: 1,
                        points_daily_login: 10,
                        points_review_bonus: 50,
                    }
                });
            }
            res.json({ success: true, data: configObj });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // POST /api/system/config
    updateConfig: async (req, res) => {
        try {
            const updates = req.body; // { key1: value1, key2: value2 }
            const operations = Object.keys(updates).map(key => ({
                updateOne: {
                    filter: { key },
                    update: { value: updates[key] },
                    upsert: true
                }
            }));
            await systemConfig_model_1.default.bulkWrite(operations);
            res.json({ success: true, message: 'Cấu hình hệ thống đã được cập nhật' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
