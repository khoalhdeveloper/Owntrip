import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Route kiểm tra phòng trống (Không cần đăng nhập)
router.post('/check-availability', BookingController.checkAvailability);

// Route tạo đặt phòng (Bắt buộc đăng nhập)
router.post('/create', verifyToken, BookingController.createBooking);

// Route xem lịch sử đặt phòng (Bắt buộc đăng nhập)
router.get('/my-bookings', verifyToken, BookingController.getMyBookings);

// Route xem chi tiết 1 booking (Bắt buộc đăng nhập)
router.get('/:id', verifyToken, BookingController.getBookingDetail);

// Route hủy đặt phòng (Bắt buộc đăng nhập)
router.post('/:id/cancel', verifyToken, BookingController.cancelBooking);

module.exports = router;
