"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Route kiểm tra phòng trống (Không cần đăng nhập)
router.post('/check-availability', booking_controller_1.BookingController.checkAvailability);
// Route tạo đặt phòng (Bắt buộc đăng nhập)
router.post('/create', auth_middleware_1.verifyToken, booking_controller_1.BookingController.createBooking);
// Route xem lịch sử đặt phòng (Bắt buộc đăng nhập)
router.get('/my-bookings', auth_middleware_1.verifyToken, booking_controller_1.BookingController.getMyBookings);
// Route xem chi tiết 1 booking (Bắt buộc đăng nhập)
router.get('/:id', auth_middleware_1.verifyToken, booking_controller_1.BookingController.getBookingDetail);
// Route hủy đặt phòng (Bắt buộc đăng nhập)
router.post('/:id/cancel', auth_middleware_1.verifyToken, booking_controller_1.BookingController.cancelBooking);
module.exports = router;
