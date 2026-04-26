"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hotel_controller_1 = require("../controllers/hotel.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Route lấy danh sách khách sạn (lọc theo city nếu có)
router.get('/', hotel_controller_1.HotelController.getAllHotels);
// Route lấy danh sách khách sạn của chính chủ 
router.get('/my-hotels', auth_middleware_1.verifyToken, hotel_controller_1.HotelController.getMyHotels);
// Route lấy dữ liệu tổng hợp cho UI (Không cần đăng nhập)
router.get('/:id/page', hotel_controller_1.HotelController.getHotelFullPage);
// Route đăng đánh giá (Bắt buộc đăng nhập)
router.post('/review', auth_middleware_1.verifyToken, hotel_controller_1.HotelController.postReview);
// Route gán chủ sở hữu cho khách sạn (Chỉ Admin)
router.post('/assign-owner', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), hotel_controller_1.HotelController.assignOwner);
// Route tạo khách sạn 
router.post('/create', auth_middleware_1.verifyToken, hotel_controller_1.HotelController.createHotel);
// Route cập nhật khách sạn 
router.patch('/:id', auth_middleware_1.verifyToken, hotel_controller_1.HotelController.updateHotel);
module.exports = router;
