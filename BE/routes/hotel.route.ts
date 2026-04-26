import { Router } from 'express';
import { HotelController } from '../controllers/hotel.controller';
import { verifyToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Route lấy danh sách khách sạn (lọc theo city nếu có)
router.get('/', HotelController.getAllHotels);

// Route lấy danh sách khách sạn của chính chủ 
router.get('/my-hotels', verifyToken, HotelController.getMyHotels);

// Route lấy dữ liệu tổng hợp cho UI (Không cần đăng nhập)
router.get('/:id/page', HotelController.getHotelFullPage);

// Route đăng đánh giá (Bắt buộc đăng nhập)
router.post('/review', verifyToken, HotelController.postReview);

// Route gán chủ sở hữu cho khách sạn (Chỉ Admin)
router.post('/assign-owner', verifyToken, authorizeRole(['admin']), HotelController.assignOwner);

// Route tạo khách sạn 
router.post('/create', verifyToken, HotelController.createHotel);

// Route cập nhật khách sạn 
router.patch('/:id', verifyToken, HotelController.updateHotel);

module.exports = router;