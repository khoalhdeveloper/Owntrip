import { Request, Response } from 'express';
import Notification from '../models/notification.model';
import { AuthRequest } from '../middlewares/auth.middleware';

export const NotificationController = {
  // Lấy danh sách notification của user
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      res.json({ success: true, notifications });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi lấy thông báo' });
    }
  },

  // Đánh dấu đã đọc
  async markRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const noti = await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
      if (!noti) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
      res.json({ success: true, notification: noti });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
    }
  }
};
