
import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { NotificationController } from '../controllers/notification.controller';

const router = express.Router();

// Lấy danh sách notification của user
router.get('/', verifyToken, NotificationController.getAll);

// Đánh dấu đã đọc
router.patch('/:id/read', verifyToken, NotificationController.markRead);

module.exports = router;
