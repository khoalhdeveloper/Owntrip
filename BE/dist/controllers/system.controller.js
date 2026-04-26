"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const systemConfig_model_1 = __importDefault(require("../models/systemConfig.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const hotel_model_1 = __importDefault(require("../models/hotel.model"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const avatarItem_model_1 = __importDefault(require("../models/avatarItem.model"));
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
    },
    // GET /api/system/dashboard-stats
    getDashboardStats: async (req, res) => {
        try {
            const [totalUsers, totalHotels, totalBookings, totalAvatars, recentBookings] = await Promise.all([
                user_model_1.default.countDocuments(),
                hotel_model_1.default.countDocuments(),
                booking_model_1.default.countDocuments(),
                avatarItem_model_1.default.countDocuments(),
                booking_model_1.default.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'displayName email')
            ]);
            // Tính tổng doanh thu
            const allBookings = await booking_model_1.default.find({ status: { $in: ['confirmed', 'completed'] } });
            const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            // Thống kê theo tháng (6 tháng gần nhất)
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                months.push({
                    name: `T${d.getMonth() + 1}`,
                    revenue: 0 // Sẽ tính sau nếu có dữ liệu theo ngày
                });
            }
            res.json({
                success: true,
                data: {
                    stats: [
                        { name: 'Người dùng', value: totalUsers, icon: 'users', color: 'blue' },
                        { name: 'Khách sạn', value: totalHotels, icon: 'hotel', color: 'emerald' },
                        { name: 'Đặt chỗ', value: totalBookings, icon: 'booking', color: 'violet' },
                        { name: 'Avatar Shop', value: totalAvatars, icon: 'sparkles', color: 'pink' },
                    ],
                    totalRevenue,
                    recentBookings,
                    chartData: months
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
