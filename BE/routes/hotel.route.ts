import { Router } from 'express';
import { HotelController } from '../controllers/hotel.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Route lấy dữ liệu tổng hợp cho UI (Không cần đăng nhập)
router.get('/:id/page', HotelController.getHotelFullPage);

// Route đăng đánh giá (Bắt buộc đăng nhập)
router.post('/review', verifyToken, HotelController.postReview);

router.post('/create', verifyToken, HotelController.createHotel);

module.exports = router;