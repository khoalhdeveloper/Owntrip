import { Request, Response } from 'express';
import SystemConfig from '../models/systemConfig.model';
import mongoose from 'mongoose';

export const SystemController = {
  // GET /api/system/info
  getSystemInfo: async (req: Request, res: Response) => {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/system/config
  getConfig: async (req: Request, res: Response) => {
    try {
      const configs = await SystemConfig.find();
      // Chuyển mảng thành object cho dễ dùng ở frontend
      const configObj = configs.reduce((acc: any, curr) => {
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // POST /api/system/config
  updateConfig: async (req: Request, res: Response) => {
    try {
      const updates = req.body; // { key1: value1, key2: value2 }

      const operations = Object.keys(updates).map(key => ({
        updateOne: {
          filter: { key },
          update: { value: updates[key] },
          upsert: true
        }
      }));

      await SystemConfig.bulkWrite(operations);

      res.json({ success: true, message: 'Cấu hình hệ thống đã được cập nhật' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
