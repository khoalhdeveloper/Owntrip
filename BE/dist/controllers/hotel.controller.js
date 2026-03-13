"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelController = void 0;
const hotel_model_1 = __importDefault(require("../models/hotel.model"));
const roomInventory_model_1 = __importDefault(require("../models/roomInventory.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
// Helper function: Tạo mảng các ngày trong khoảng thời gian
const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (currentDate < end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};
exports.HotelController = {
    /**
     * Lấy toàn bộ dữ liệu trang chi tiết khách sạn (Agoda Style)
     * GET /api/hotels/:id?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
     */
    getHotelFullPage: async (req, res) => {
        try {
            const { id } = req.params; // HotelId00x
            const { checkIn, checkOut } = req.query;
            if (!checkIn || !checkOut) {
                return res.status(400).json({ message: "Vui lòng chọn ngày nhận/trả phòng" });
            }
            const startDate = new Date(checkIn);
            const endDate = new Date(checkOut);
            // 1. Lấy thông tin khách sạn (Gallery, Amenities, Address)
            const hotel = await hotel_model_1.default.findOne({ hotelId: id });
            if (!hotel)
                return res.status(404).json({ message: "Khách sạn không tồn tại" });
            // 2. Tìm giá thấp nhất "Chỉ từ..." trong khoảng ngày khách chọn
            const minPriceRecord = await roomInventory_model_1.default.findOne({
                hotelId: id,
                date: { $gte: startDate, $lt: endDate },
                $expr: { $gt: ["$totalInventory", "$bookedCount"] } // Chỉ lấy ngày còn phòng
            }).sort({ priceAtDate: 1 });
            // 3. Lấy 3 đánh giá tiêu biểu nhất để hiện khối "Điểm nổi bật"
            const topReviews = await review_model_1.default.find({ targetId: id })
                .sort({ rating: -1 }) // Lấy đánh giá điểm cao trước
                .limit(3)
                .select('userId comment rating criteria createdAt');
            // 4. Trả về cấu trúc JSON "Full Option" cho React
            res.status(200).json({
                success: true,
                data: {
                    header: {
                        name: hotel.name,
                        stars: hotel.starRating,
                        address: hotel.address,
                        images: hotel.images,
                        tags: hotel.tags // Ví dụ: ['Bán chạy nhất', '2024']
                    },
                    // Dữ liệu vẽ thanh Progress Bar (Sạch sẽ, Dịch vụ...)
                    reviewDashboard: hotel.reviewSummary,
                    pricing: {
                        fromPrice: minPriceRecord ? minPriceRecord.priceAtDate : "Hết phòng",
                        currency: "VND"
                    },
                    location: {
                        coordinates: hotel.address.coordinates,
                        mapThumbnail: `https://maps.googleapis.com/maps/api/staticmap?center=${hotel.address.coordinates.lat},${hotel.address.coordinates.lng}&zoom=15&size=400x200`
                    },
                    topReviews
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * API Đăng đánh giá & Tự động cập nhật Dashboard điểm khách sạn
     */
    postReview: async (req, res) => {
        try {
            const { targetId, rating, criteria, comment } = req.body;
            const userId = req.user.userId; // Lấy từ verifyToken middleware
            // 1. Lưu review mới
            const newReview = new review_model_1.default({
                userId,
                targetId,
                targetType: 'hotel',
                rating,
                criteria,
                comment
            });
            await newReview.save();
            // 2. Dùng Aggregation để tính toán lại toàn bộ Dashboard điểm số
            const stats = await review_model_1.default.aggregate([
                { $match: { targetId: targetId } },
                {
                    $group: {
                        _id: "$targetId",
                        avgScore: { $avg: "$rating" },
                        avgClean: { $avg: "$criteria.cleanliness" },
                        avgService: { $avg: "$criteria.service" },
                        avgFacilities: { $avg: "$criteria.facilities" },
                        count: { $sum: 1 }
                    }
                }
            ]);
            // 3. Cập nhật ngược lại vào Hotel Model để lần sau Get nhanh hơn
            await hotel_model_1.default.findOneAndUpdate({ hotelId: targetId }, {
                "reviewSummary.score": stats[0].avgScore,
                "reviewSummary.count": stats[0].count,
                "reviewSummary.cleanliness": stats[0].avgClean,
                "reviewSummary.service": stats[0].avgService,
                "reviewSummary.facilities": stats[0].avgFacilities
            });
            res.status(201).json({ success: true, message: "Cảm ơn bạn đã đánh giá!" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    createHotel: async (req, res) => {
        try {
            const { name, starRating, address, images, description, rooms, tags, inventorySetup } = req.body;
            // 1. Kiểm tra dữ liệu đầu vào cơ bản
            if (!name || !address || !address.fullAddress) {
                return res.status(400).json({
                    success: false,
                    message: "Tên khách sạn và địa chỉ là bắt buộc"
                });
            }
            // 2. Khởi tạo đối tượng Hotel mới
            // Lưu ý: hotelId sẽ tự động sinh nhờ Middleware 'pre-save'
            const newHotel = new hotel_model_1.default({
                name,
                starRating,
                address,
                images,
                description,
                rooms, // Mảng chứa các loại phòng như Deluxe, Suite...
                tags, // Ví dụ: ["Bán chạy nhất", "Giá tốt 2026"]
                reviewSummary: {
                    score: 0,
                    count: 0,
                    cleanliness: 0,
                    service: 0,
                    facilities: 0
                }
            });
            // 3. Lưu vào Database
            const savedHotel = await newHotel.save();
            // 4. Tự động tạo Inventory nếu có inventorySetup
            let totalInventoryRecords = 0;
            if (inventorySetup && inventorySetup.length > 0) {
                for (const setup of inventorySetup) {
                    if (setup.start && setup.end && setup.roomTypeId && setup.total && setup.price) {
                        const dates = getDatesInRange(new Date(setup.start), new Date(setup.end));
                        const inventoryEntries = dates.map(date => {
                            // Dynamic pricing: Cuối tuần +20%
                            const dayOfWeek = date.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const finalPrice = isWeekend ? Math.floor(setup.price * 1.2) : setup.price;
                            return {
                                hotelId: savedHotel.hotelId,
                                roomTypeId: setup.roomTypeId,
                                date,
                                totalInventory: setup.total,
                                priceAtDate: finalPrice,
                                bookedCount: 0,
                                status: 'available'
                            };
                        });
                        await roomInventory_model_1.default.insertMany(inventoryEntries);
                        totalInventoryRecords += inventoryEntries.length;
                    }
                }
            }
            res.status(201).json({
                success: true,
                message: "Thêm khách sạn thành công!",
                hotelId: savedHotel.hotelId,
                inventoryCreated: totalInventoryRecords
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
