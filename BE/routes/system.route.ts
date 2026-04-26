import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';
import { verifyToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Chỉ Admin mới được xem/sửa cài đặt hệ thống
router.get('/info', verifyToken, authorizeRole(['admin']), SystemController.getSystemInfo);
router.get('/config', verifyToken, authorizeRole(['admin']), SystemController.getConfig);
router.post('/config', verifyToken, authorizeRole(['admin']), SystemController.updateConfig);

module.exports = router;
