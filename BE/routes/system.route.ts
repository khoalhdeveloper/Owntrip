import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';
import { verifyToken, authorizeRole } from '../middlewares/auth.middleware';
import { uploadHotelImage } from '../middlewares/upload.middleware';

const router = Router();

// Chỉ Admin mới được xem/sửa cài đặt hệ thống
router.get('/info', verifyToken, authorizeRole(['admin']), SystemController.getSystemInfo);
router.get('/config', verifyToken, authorizeRole(['admin']), SystemController.getConfig);
router.post('/config', verifyToken, authorizeRole(['admin']), SystemController.updateConfig);
router.get('/dashboard-stats', verifyToken, authorizeRole(['admin']), SystemController.getDashboardStats);
router.get('/paid-customers', verifyToken, authorizeRole(['admin']), SystemController.getPaidCustomers);
router.get('/hotel-owners', verifyToken, authorizeRole(['admin']), SystemController.getHotelOwners);
router.get('/point-topups', verifyToken, authorizeRole(['admin']), SystemController.getPointTopups);

// Upload ảnh khách sạn lên Cloudinary (hotel_owner hoặc admin)
router.post(
  '/upload-image',
  verifyToken,
  uploadHotelImage.single('image'),
  SystemController.uploadImage
);

module.exports = router;
