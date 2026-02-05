import { Request, Response } from 'express';
import Hotel from '../models/hotel.model';
import RoomInventory from '../models/roomInventory.model';
import Review from '../models/review.model';

export const HotelController = {
  /**
   * Lấy toàn bộ dữ liệu trang chi tiết khách sạn (Agoda Style)
   * GET /api/hotels/:id?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
   */
  getHotelFullPage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // HotelId00x
      const { checkIn, checkOut } = req.query;

      if (!checkIn || !checkOut) {
        return res.status(400).json({ message: "Vui lòng chọn ngày nhận/trả phòng" });
      }

      const startDate = new Date(checkIn as string);
      const endDate = new Date(checkOut as string);

      // 1. Lấy thông tin khách sạn (Gallery, Amenities, Address)
      const hotel = await Hotel.findOne({ hotelId: id });
      if (!hotel) return res.status(404).json({ message: "Khách sạn không tồn tại" });

      // 2. Tìm giá thấp nhất "Chỉ từ..." trong khoảng ngày khách chọn
      const minPriceRecord = await RoomInventory.findOne({
        hotelId: id,
        date: { $gte: startDate, $lt: endDate },
        $expr: { $gt: ["$totalInventory", "$bookedCount"] } // Chỉ lấy ngày còn phòng
      }).sort({ priceAtDate: 1 });

      // 3. Lấy 3 đánh giá tiêu biểu nhất để hiện khối "Điểm nổi bật"
      const topReviews = await Review.find({ targetId: id })
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * API Đăng đánh giá & Tự động cập nhật Dashboard điểm khách sạn
   */
  postReview: async (req: Request, res: Response) => {
    try {
      const { targetId, rating, criteria, comment } = req.body;
      const userId = (req as any).user.userId; // Lấy từ verifyToken middleware

      // 1. Lưu review mới
      const newReview = new Review({
        userId,
        targetId,
        targetType: 'hotel',
        rating,
        criteria,
        comment
      });
      await newReview.save();

      // 2. Dùng Aggregation để tính toán lại toàn bộ Dashboard điểm số
      const stats = await Review.aggregate([
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
      await Hotel.findOneAndUpdate(
        { hotelId: targetId },
        {
          "reviewSummary.score": stats[0].avgScore,
          "reviewSummary.count": stats[0].count,
          "reviewSummary.cleanliness": stats[0].avgClean,
          "reviewSummary.service": stats[0].avgService,
          "reviewSummary.facilities": stats[0].avgFacilities
        }
      );

      res.status(201).json({ success: true, message: "Cảm ơn bạn đã đánh giá!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  createHotel: async (req: Request, res: Response) => {
    try {
      const { name, starRating, address, images, description, rooms, tags } = req.body;

      // 1. Kiểm tra dữ liệu đầu vào cơ bản
      if (!name || !address || !address.fullAddress) {
        return res.status(400).json({ 
          success: false, 
          message: "Tên khách sạn và địa chỉ là bắt buộc" 
        });
      }

      // 2. Khởi tạo đối tượng Hotel mới
      // Lưu ý: hotelId sẽ tự động sinh nhờ Middleware 'pre-save'
      const newHotel = new Hotel({
        name,
        starRating,
        address,
        images,
        description,
        rooms, // Mảng chứa các loại phòng như Deluxe, Suite...
        tags,  // Ví dụ: ["Bán chạy nhất", "Giá tốt 2026"]
        reviewSummary: { // Khởi tạo điểm mặc định
          score: 0,
          count: 0,
          cleanliness: 0,
          service: 0,
          facilities: 0
        }
      });

      // 3. Lưu vào Database
      const savedHotel = await newHotel.save();

      res.status(201).json({
        success: true,
        message: "Thêm khách sạn thành công!",
        hotelId: savedHotel.hotelId
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};