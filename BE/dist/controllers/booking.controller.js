"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const roomInventory_model_1 = __importDefault(require("../models/roomInventory.model"));
const hotel_model_1 = __importDefault(require("../models/hotel.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const emailService_1 = require("../utils/emailService");
exports.BookingController = {
    /**
     * API 1: Kiểm tra tình trạng phòng trống
     * POST /api/bookings/check-availability
     */
    checkAvailability: async (req, res) => {
        try {
            const { hotelId, roomTypeId, checkIn, checkOut, roomCount } = req.body;
            // Validation cơ bản
            if (!hotelId || !roomTypeId || !checkIn || !checkOut || !roomCount) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc"
                });
            }
            const startDate = new Date(checkIn);
            const endDate = new Date(checkOut);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Validate ngày
            if (startDate < today) {
                return res.status(400).json({
                    success: false,
                    message: "Không thể đặt phòng cho ngày trong quá khứ"
                });
            }
            if (endDate <= startDate) {
                return res.status(400).json({
                    success: false,
                    message: "Ngày trả phòng phải sau ngày nhận phòng"
                });
            }
            // Tạo mảng các ngày trong khoảng thời gian
            const dateRange = [];
            let currentDate = new Date(startDate);
            while (currentDate < endDate) {
                dateRange.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            // Kiểm tra tồn kho cho từng ngày
            const breakdown = [];
            let totalPrice = 0;
            let isAvailable = true;
            for (const date of dateRange) {
                const inventory = await roomInventory_model_1.default.findOne({
                    hotelId,
                    roomTypeId,
                    date: {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lt: new Date(date.setHours(23, 59, 59, 999))
                    }
                });
                if (!inventory) {
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy thông tin tồn kho cho ngày ${date.toISOString().split('T')[0]}`
                    });
                }
                const availableRooms = inventory.totalInventory - inventory.bookedCount;
                if (availableRooms < roomCount) {
                    isAvailable = false;
                }
                breakdown.push({
                    date: date.toISOString().split('T')[0],
                    price: inventory.priceAtDate,
                    available: availableRooms,
                    status: inventory.status
                });
                totalPrice += inventory.priceAtDate * roomCount;
            }
            res.status(200).json({
                success: true,
                available: isAvailable,
                totalPrice,
                nights: dateRange.length,
                breakdown,
                message: isAvailable
                    ? "Phòng còn trống, bạn có thể đặt!"
                    : "Rất tiếc, không đủ phòng trong khoảng thời gian này"
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * API 2: Tạo đơn đặt phòng (với Transaction ACID)
     * POST /api/bookings/create
     */
    createBooking: async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { hotelId, roomTypeId, checkIn, checkOut, roomCount, guestInfo, paymentMethod } = req.body;
            const userId = req.user.userId; // Từ verifyToken middleware
            // 1. Validation
            if (!hotelId || !roomTypeId || !checkIn || !checkOut || !roomCount || !guestInfo) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
            }
            // Validate phone format
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(guestInfo.phone)) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ" });
            }
            const startDate = new Date(checkIn);
            const endDate = new Date(checkOut);
            // 2. Tạo mảng ngày
            const dateRange = [];
            let currentDate = new Date(startDate);
            while (currentDate < endDate) {
                dateRange.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            const nights = dateRange.length;
            // 3. Tính tổng tiền & Kiểm tra tồn kho
            let totalPrice = 0;
            for (const date of dateRange) {
                const inventory = await roomInventory_model_1.default.findOne({
                    hotelId,
                    roomTypeId,
                    date: {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lt: new Date(date.setHours(23, 59, 59, 999))
                    }
                }).session(session);
                if (!inventory) {
                    await session.abortTransaction();
                    return res.status(404).json({ message: "Không tìm thấy thông tin phòng" });
                }
                const availableRooms = inventory.totalInventory - inventory.bookedCount;
                if (availableRooms < roomCount) {
                    await session.abortTransaction();
                    return res.status(400).json({
                        message: `Chỉ còn ${availableRooms} phòng trống vào ngày ${date.toISOString().split('T')[0]}`
                    });
                }
                totalPrice += inventory.priceAtDate * roomCount;
            }
            // 4. Kiểm tra số dư User (nếu thanh toán bằng balance)
            const user = await user_model_1.default.findOne({ userId }).session(session);
            if (!user) {
                await session.abortTransaction();
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }
            if (paymentMethod === 'balance' && user.balance < totalPrice) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Số dư không đủ. Cần ${totalPrice.toLocaleString()} VND, bạn có ${user.balance.toLocaleString()} VND`
                });
            }
            // 5. Tạo Booking mới
            const newBooking = new booking_model_1.default({
                userId,
                hotelId,
                roomTypeId,
                checkIn: startDate,
                checkOut: endDate,
                nights,
                roomCount,
                totalPrice,
                status: 'confirmed',
                guestInfo,
                paymentMethod,
                paymentStatus: paymentMethod === 'balance' ? 'paid' : 'unpaid'
            });
            await newBooking.save({ session });
            // 6. Cập nhật bookedCount cho từng ngày
            for (const date of dateRange) {
                await roomInventory_model_1.default.findOneAndUpdate({
                    hotelId,
                    roomTypeId,
                    date: {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lt: new Date(date.setHours(23, 59, 59, 999))
                    }
                }, { $inc: { bookedCount: roomCount } }, { session });
            }
            // 7. Trừ tiền user & Tích điểm (1 point/1000 VND)
            if (paymentMethod === 'balance') {
                const pointsEarned = Math.floor(totalPrice / 1000);
                await user_model_1.default.findOneAndUpdate({ userId }, {
                    $inc: {
                        balance: -totalPrice,
                        points: pointsEarned
                    }
                }, { session });
            }
            // 8. Commit transaction
            await session.commitTransaction();
            // 9. Gửi email xác nhận (không chặn response)
            const hotel = await hotel_model_1.default.findOne({ hotelId });
            if (hotel && guestInfo.email) {
                (0, emailService_1.sendEmailTemplate)(guestInfo.email, '✅ Xác nhận đặt phòng thành công', 'bookingConfirmation', {
                    fullName: guestInfo.fullName,
                    bookingId: newBooking.bookingId,
                    hotelName: hotel.name,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    roomCount: roomCount.toString(),
                    totalPrice: totalPrice.toLocaleString()
                }).catch((err) => console.error('Email error:', err));
            }
            res.status(201).json({
                success: true,
                message: "Đặt phòng thành công!",
                data: {
                    bookingId: newBooking.bookingId,
                    totalPrice,
                    status: newBooking.status
                }
            });
        }
        catch (error) {
            await session.abortTransaction();
            res.status(500).json({ success: false, message: error.message });
        }
        finally {
            session.endSession();
        }
    },
    /**
     * API 3: Xem lịch sử đặt phòng của user
     * GET /api/bookings/my-bookings
     */
    getMyBookings: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 10, status } = req.query;
            const query = { userId };
            if (status) {
                query.status = status;
            }
            const bookings = await booking_model_1.default.find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip((Number(page) - 1) * Number(limit));
            // Populate thông tin hotel
            const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
                const hotel = await hotel_model_1.default.findOne({ hotelId: booking.hotelId })
                    .select('name address images starRating');
                return {
                    bookingId: booking.bookingId,
                    hotel: hotel ? {
                        name: hotel.name,
                        address: hotel.address.fullAddress,
                        image: hotel.images[0],
                        stars: hotel.starRating
                    } : null,
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                    roomCount: booking.roomCount,
                    totalPrice: booking.totalPrice,
                    status: booking.status,
                    createdAt: booking.createdAt
                };
            }));
            const total = await booking_model_1.default.countDocuments(query);
            res.status(200).json({
                success: true,
                data: enrichedBookings,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * API 4: Xem chi tiết 1 booking
     * GET /api/bookings/:id
     */
    getBookingDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const booking = await booking_model_1.default.findOne({ bookingId: id });
            if (!booking) {
                return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
            }
            // Kiểm tra quyền truy cập (chỉ user sở hữu booking mới xem được)
            if (booking.userId !== userId) {
                return res.status(403).json({ message: "Bạn không có quyền xem booking này" });
            }
            const hotel = await hotel_model_1.default.findOne({ hotelId: booking.hotelId });
            res.status(200).json({
                success: true,
                data: {
                    ...booking.toObject(),
                    hotel: hotel ? {
                        name: hotel.name,
                        address: hotel.address,
                        images: hotel.images,
                        stars: hotel.starRating
                    } : null
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * API 5: Hủy đặt phòng
     * POST /api/bookings/:id/cancel
     */
    cancelBooking: async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user.userId;
            // 1. Tìm booking
            const booking = await booking_model_1.default.findOne({ bookingId: id }).session(session);
            if (!booking) {
                await session.abortTransaction();
                return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
            }
            if (booking.userId !== userId) {
                await session.abortTransaction();
                return res.status(403).json({ message: "Bạn không có quyền hủy booking này" });
            }
            if (booking.status === 'cancelled') {
                await session.abortTransaction();
                return res.status(400).json({ message: "Đơn đặt phòng đã được hủy trước đó" });
            }
            // 2. Kiểm tra chính sách hủy (VD: hủy trước 24h)
            const now = new Date();
            const checkInTime = new Date(booking.checkIn);
            const hoursDiff = (checkInTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            let refundPercentage = 1.0; // Hoàn 100%
            if (hoursDiff < 24) {
                refundPercentage = 0.5; // Chỉ hoàn 50% nếu hủy trong vòng 24h
            }
            const refundAmount = Math.floor(booking.totalPrice * refundPercentage);
            // 3. Giảm bookedCount cho từng ngày
            const dateRange = [];
            let currentDate = new Date(booking.checkIn);
            while (currentDate < new Date(booking.checkOut)) {
                dateRange.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            for (const date of dateRange) {
                await roomInventory_model_1.default.findOneAndUpdate({
                    hotelId: booking.hotelId,
                    roomTypeId: booking.roomTypeId,
                    date: {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lt: new Date(date.setHours(23, 59, 59, 999))
                    }
                }, { $inc: { bookedCount: -booking.roomCount } }, { session });
            }
            // 4. Hoàn tiền vào balance (nếu đã thanh toán bằng balance)
            if (booking.paymentMethod === 'balance' && booking.paymentStatus === 'paid') {
                await user_model_1.default.findOneAndUpdate({ userId }, { $inc: { balance: refundAmount } }, { session });
            }
            // 5. Cập nhật trạng thái booking
            booking.status = 'cancelled';
            booking.paymentStatus = 'refunded';
            booking.cancellationReason = reason || 'Không có lý do';
            booking.cancelledAt = now;
            booking.refundAmount = refundAmount;
            await booking.save({ session });
            await session.commitTransaction();
            res.status(200).json({
                success: true,
                message: "Hủy đặt phòng thành công!",
                data: {
                    refundAmount,
                    refundPercentage: refundPercentage * 100 + '%'
                }
            });
        }
        catch (error) {
            await session.abortTransaction();
            res.status(500).json({ success: false, message: error.message });
        }
        finally {
            session.endSession();
        }
    }
};
