import { Request, Response } from 'express';
import RoomInventory from '../models/roomInventory.model';
import Hotel from '../models/hotel.model';

export const InventoryController = {
  /**
   * API 1: Tạo hoặc cập nhật inventory cho nhiều ngày
   * POST /api/inventory/bulk-create
   */
  bulkCreateInventory: async (req: Request, res: Response) => {
    try {
      const { hotelId, roomTypeId, startDate, endDate, totalInventory, basePrice } = req.body;

      // Validation
      if (!hotelId || !roomTypeId || !startDate || !endDate || !totalInventory || !basePrice) {
        return res.status(400).json({ 
          success: false, 
          message: "Thiếu thông tin bắt buộc" 
        });
      }

      // Kiểm tra hotel tồn tại
      const hotel = await Hotel.findOne({ hotelId });
      if (!hotel) {
        return res.status(404).json({ message: "Khách sạn không tồn tại" });
      }

      // Kiểm tra roomType có trong hotel không
      const roomExists = hotel.rooms.some(room => room.roomTypeId === roomTypeId);
      if (!roomExists) {
        return res.status(404).json({ message: "Loại phòng không tồn tại trong khách sạn này" });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });
      }

      // Tạo inventory cho từng ngày
      const inventories = [];
      let currentDate = new Date(start);
      
      while (currentDate < end) {
        const date = new Date(currentDate);
        date.setHours(0, 0, 0, 0);

        // Dynamic pricing: Cuối tuần +20%
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const price = isWeekend ? Math.floor(basePrice * 1.2) : basePrice;

        // Upsert: Tạo mới nếu chưa có, update nếu đã có
        const inventory = await RoomInventory.findOneAndUpdate(
          { hotelId, roomTypeId, date },
          {
            hotelId,
            roomTypeId,
            date,
            totalInventory,
            priceAtDate: price,
            status: 'available'
          },
          { upsert: true, new: true }
        );

        inventories.push(inventory);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.status(201).json({
        success: true,
        message: `Đã tạo/cập nhật ${inventories.length} bản ghi inventory`,
        data: {
          hotelId,
          roomTypeId,
          count: inventories.length,
          dateRange: { startDate, endDate }
        }
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * API 2: Lấy inventory theo hotel và khoảng thời gian
   * GET /api/inventory?hotelId=xxx&roomTypeId=xxx&startDate=xxx&endDate=xxx
   */
  getInventory: async (req: Request, res: Response) => {
    try {
      const { hotelId, roomTypeId, startDate, endDate } = req.query;

      if (!hotelId || !startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: "Thiếu hotelId, startDate hoặc endDate" 
        });
      }

      const query: any = {
        hotelId,
        date: {
          $gte: new Date(startDate as string),
          $lt: new Date(endDate as string)
        }
      };

      if (roomTypeId) {
        query.roomTypeId = roomTypeId;
      }

      const inventories = await RoomInventory.find(query).sort({ date: 1, roomTypeId: 1 });

      // Tính thống kê
      const stats = {
        totalRecords: inventories.length,
        totalRevenuePotential: inventories.reduce((sum, inv) => sum + (inv.priceAtDate * inv.totalInventory), 0),
        totalBooked: inventories.reduce((sum, inv) => sum + inv.bookedCount, 0),
        totalAvailable: inventories.reduce((sum, inv) => sum + (inv.totalInventory - inv.bookedCount), 0),
        occupancyRate: 0
      };

      const totalCapacity = inventories.reduce((sum, inv) => sum + inv.totalInventory, 0);
      if (totalCapacity > 0) {
        stats.occupancyRate = (stats.totalBooked / totalCapacity) * 100;
      }

      res.status(200).json({
        success: true,
        data: inventories,
        stats
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * API 3: Cập nhật giá hoặc số lượng phòng cho 1 ngày cụ thể
   * PUT /api/inventory/:id
   */
  updateInventory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { totalInventory, priceAtDate, status } = req.body;

      const updateData: any = {};
      if (totalInventory !== undefined) updateData.totalInventory = totalInventory;
      if (priceAtDate !== undefined) updateData.priceAtDate = priceAtDate;
      if (status !== undefined) updateData.status = status;

      const inventory = await RoomInventory.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!inventory) {
        return res.status(404).json({ message: "Không tìm thấy inventory" });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật inventory thành công",
        data: inventory
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * API 4: Cập nhật giá hàng loạt (VD: tăng giá dịp lễ)
   * POST /api/inventory/bulk-price-update
   */
  bulkPriceUpdate: async (req: Request, res: Response) => {
    try {
      const { hotelId, roomTypeId, startDate, endDate, priceMultiplier, fixedPrice } = req.body;

      if (!hotelId || !startDate || !endDate) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      const query: any = {
        hotelId,
        date: {
          $gte: new Date(startDate),
          $lt: new Date(endDate)
        }
      };

      if (roomTypeId) {
        query.roomTypeId = roomTypeId;
      }

      let updateQuery: any = {};
      
      if (fixedPrice) {
        // Cập nhật giá cố định
        updateQuery = { priceAtDate: fixedPrice };
      } else if (priceMultiplier) {
        // Nhân giá hiện tại với hệ số (VD: 1.5 = tăng 50%)
        const inventories = await RoomInventory.find(query);
        
        for (const inv of inventories) {
          await RoomInventory.findByIdAndUpdate(
            inv._id,
            { priceAtDate: Math.floor(inv.priceAtDate * priceMultiplier) }
          );
        }

        return res.status(200).json({
          success: true,
          message: `Đã cập nhật giá cho ${inventories.length} bản ghi`,
          multiplier: priceMultiplier
        });
      } else {
        return res.status(400).json({ message: "Phải có fixedPrice hoặc priceMultiplier" });
      }

      const result = await RoomInventory.updateMany(query, updateQuery);

      res.status(200).json({
        success: true,
        message: "Cập nhật giá hàng loạt thành công",
        modifiedCount: result.modifiedCount
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * API 5: Xóa inventory (cho admin)
   * DELETE /api/inventory
   */
  deleteInventory: async (req: Request, res: Response) => {
    try {
      const { hotelId, roomTypeId, startDate, endDate } = req.body;

      if (!hotelId || !startDate || !endDate) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      const query: any = {
        hotelId,
        date: {
          $gte: new Date(startDate),
          $lt: new Date(endDate)
        },
        bookedCount: 0 // Chỉ xóa phòng chưa có booking
      };

      if (roomTypeId) {
        query.roomTypeId = roomTypeId;
      }

      const result = await RoomInventory.deleteMany(query);

      res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} bản ghi inventory`,
        deletedCount: result.deletedCount
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * API 6: Dashboard thống kê inventory
   * GET /api/inventory/dashboard?hotelId=xxx
   */
  getDashboard: async (req: Request, res: Response) => {
    try {
      const { hotelId } = req.query;

      if (!hotelId) {
        return res.status(400).json({ message: "Thiếu hotelId" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const next30Days = new Date(today);
      next30Days.setDate(next30Days.getDate() + 30);

      // Lấy tất cả inventory cho 30 ngày tới
      const inventories = await RoomInventory.find({
        hotelId,
        date: { $gte: today, $lt: next30Days }
      });

      // Thống kê theo room type
      const roomTypeStats: any = {};
      
      inventories.forEach(inv => {
        if (!roomTypeStats[inv.roomTypeId]) {
          roomTypeStats[inv.roomTypeId] = {
            totalInventory: 0,
            totalBooked: 0,
            totalRevenue: 0,
            avgPrice: 0,
            days: 0
          };
        }

        const stats = roomTypeStats[inv.roomTypeId];
        stats.totalInventory += inv.totalInventory;
        stats.totalBooked += inv.bookedCount;
        stats.totalRevenue += inv.bookedCount * inv.priceAtDate;
        stats.avgPrice += inv.priceAtDate;
        stats.days += 1;
      });

      // Tính trung bình
      Object.keys(roomTypeStats).forEach(key => {
        const stats = roomTypeStats[key];
        stats.avgPrice = Math.floor(stats.avgPrice / stats.days);
        stats.occupancyRate = ((stats.totalBooked / stats.totalInventory) * 100).toFixed(2);
        stats.availableRooms = stats.totalInventory - stats.totalBooked;
      });

      res.status(200).json({
        success: true,
        data: {
          dateRange: { start: today, end: next30Days },
          roomTypeStats,
          totalRecords: inventories.length
        }
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
