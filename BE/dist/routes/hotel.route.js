"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hotel_controller_1 = require("../controllers/hotel.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Route lấy dữ liệu tổng hợp cho UI (Không cần đăng nhập)
router.get('/:id/page', hotel_controller_1.HotelController.getHotelFullPage);
// Route đăng đánh giá (Bắt buộc đăng nhập)
router.post('/review', auth_middleware_1.verifyToken, hotel_controller_1.HotelController.postReview);
router.post('/create', auth_middleware_1.verifyToken, hotel_controller_1.HotelController.createHotel);
module.exports = router;
