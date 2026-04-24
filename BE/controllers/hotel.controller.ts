import { Request, Response } from 'express';
import Hotel from '../models/hotel.model';
import RoomInventory from '../models/roomInventory.model';
import Review from '../models/review.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// Helper function: Tạo mảng các ngày trong khoảng thời gian
const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
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

export const HotelController = {
  /**
   * Lấy danh sách khách sạn (có thể lọc theo city)
   * GET /api/hotels?city=Da+Nang
   */
  getAllHotels: async (req: Request, res: Response) => {
    try {
      const { city } = req.query;
      const filter: any = {};
      if (city) {
        filter['address.city'] = { $regex: new RegExp(city as string, 'i') };
      }
      const hotels = await Hotel.find(filter).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: hotels });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Lấy toàn bộ dữ liệu trang chi tiết khách sạn (Agoda Style)
   * GET /api/hotels/:id?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
   */
  getHotelFullPage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // HotelId00x
      const { checkIn, checkOut } = req.query;

      // Nếu không có ngày, mặc định là hôm nay và ngày mai
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const startDate = checkIn ? new Date(checkIn as string) : today;
      const endDate = checkOut ? new Date(checkOut as string) : tomorrow;
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

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
          description: hotel.description,
          rooms: hotel.rooms,
          amenities: hotel.amenities,
          pricing: {
            fromPrice: minPriceRecord ? minPriceRecord.priceAtDate : (hotel.rooms?.[0]?.basePrice || "Hết phòng"),
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
  createHotel: async (req: AuthRequest, res: Response) => {
    try {
      const { name, starRating, ownerId, address, images, description, amenities, rooms, tags, inventorySetup } = req.body;
      const userId = ownerId || req.user?.userId; // Ưu tiên ID từ body để bạn dễ test

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
        amenities,
        rooms, // Mảng chứa các loại phòng như Deluxe, Suite...
        tags,  // Ví dụ: ["Bán chạy nhất", "Giá tốt 2026"]
        reviewSummary: { // Khởi tạo điểm mặc định
          score: 0,
          count: 0,
          cleanliness: 0,
          service: 0,
          facilities: 0
        },
        ownerId: ownerId || req.user?.userId // Gán trực tiếp ở đây cho an toàn
      });

      // 3. Lưu vào Database
      const savedHotel = await newHotel.save();

      // 4. Tự động tạo Inventory nếu có inventorySetup
      let totalInventoryRecords = 0;
      if (inventorySetup && inventorySetup.length > 0) {
        // Xóa sạch inventory cũ của hotelId này (nếu có) để tránh lỗi duplicate key
        await RoomInventory.deleteMany({ hotelId: savedHotel.hotelId });
        
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
            
            await RoomInventory.insertMany(inventoryEntries);
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Lấy danh sách khách sạn của chính chủ (dành cho Dashboard)
  getMyHotels: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const hotels = await Hotel.find({ ownerId: userId });
      res.status(200).json({ success: true, data: hotels });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Cập nhật thông tin khách sạn (Có kiểm tra quyền sở hữu)
  updateHotel: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params; // hotelId
      const userId = req.user?.userId;
      const role = req.user?.role;

      const hotel = await Hotel.findOne({ hotelId: id });
      if (!hotel) return res.status(404).json({ success: false, message: "Khách sạn không tồn tại" });

      // Lớp bảo vệ: Admin được sửa mọi thứ, Hotel Owner chỉ được sửa của mình
      if (role !== 'admin' && hotel.ownerId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: "Bạn không có quyền chỉnh sửa khách sạn này!" 
        });
      }

      // Thực hiện cập nhật các trường được gửi lên
      const updatedHotel = await Hotel.findOneAndUpdate(
        { hotelId: id },
        { $set: req.body },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công!",
        data: updatedHotel
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Admin gán chủ sở hữu cho khách sạn
  assignOwner: async (req: AuthRequest, res: Response) => {
    try {
      const { hotelId, ownerId } = req.body;

      if (!hotelId || !ownerId) {
        return res.status(400).json({ success: false, message: "Cần truyền hotelId và ownerId" });
      }

      const hotel = await Hotel.findOneAndUpdate(
        { hotelId },
        { $set: { ownerId } },
        { new: true }
      );

      if (!hotel) return res.status(404).json({ success: false, message: "Khách sạn không tồn tại" });

      res.status(200).json({
        success: true,
        message: `Đã gán ${ownerId} làm chủ khách sạn ${hotelId}`,
        data: hotel
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};