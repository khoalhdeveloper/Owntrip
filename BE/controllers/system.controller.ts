import { Request, Response } from 'express';
import SystemConfig from '../models/systemConfig.model';
import mongoose from 'mongoose';

export const SystemController = {
  // GET /api/system/info
  getSystemInfo: async (req: Request, res: Response) => {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
      const uptime = process.uptime();

      res.json({
        success: true,
        data: {
          appName: 'OwnTrip Admin',
          version: '1.0.0',
          dbStatus,
          uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/system/config
  getConfig: async (req: Request, res: Response) => {
    try {
      const configs = await SystemConfig.find();
      // Chuyển mảng thành object cho dễ dùng ở frontend
      const configObj = configs.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      // Nếu chưa có config nào, trả về mặc định
      if (configs.length === 0) {
        return res.json({
          success: true,
          data: {
            points_per_vnpay_1000: 1,
            points_daily_login: 10,
            points_review_bonus: 50,
            commission_hotel_owner_percent: 90,
            commission_hotel_admin_percent: 10,
            commission_trip_creator_percent: 70,
            commission_trip_admin_percent: 30,
          }
        });
      }

      res.json({ success: true, data: configObj });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // POST /api/system/config
  updateConfig: async (req: Request, res: Response) => {
    try {
      const updates = req.body; // { key1: value1, key2: value2 }

      const operations = Object.keys(updates).map(key => ({
        updateOne: {
          filter: { key },
          update: { value: updates[key] },
          upsert: true
        }
      }));

      await SystemConfig.bulkWrite(operations);

      res.json({ success: true, message: 'Cấu hình hệ thống đã được cập nhật' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/system/paid-customers
  getPaidCustomers: async (req: Request, res: Response) => {
    try {
      const User = require('../models/user.model').default;
      const Order = require('../models/order.model').default;
      const CreatorSubscriptionTransaction = require('../models/creatorSubscriptionTransaction.model').default;

      const now = new Date();
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const transactionFilter = { createdAt: { $gte: startOfPreviousMonth, $lte: now } };

      const [creatorTransactions, planTransactions] = await Promise.all([
        CreatorSubscriptionTransaction.find({ status: 'success', ...transactionFilter })
          .populate('packageId', 'name price')
          .sort({ createdAt: -1 })
          .lean(),
        Order.find({ status: 'SUCCESS', ...transactionFilter })
          .populate('tripTemplateId', 'title name')
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      const transactions = [
        ...creatorTransactions.map((transaction: any) => ({
          id: String(transaction._id),
          userId: transaction.userId,
          type: 'Creator',
          itemName: transaction.packageId?.name || 'Gói Creator',
          amount: transaction.amount,
          orderCode: transaction.orderCode,
          status: 'success',
          createdAt: transaction.createdAt,
        })),
        ...planTransactions.map((transaction: any) => ({
          id: String(transaction._id),
          userId: transaction.buyerId,
          type: 'Plan',
          itemName: transaction.tripTemplateId?.title || transaction.tripTemplateId?.name || 'Plan du lịch',
          amount: transaction.amount,
          orderCode: transaction.orderCode,
          status: 'success',
          createdAt: transaction.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const userIds = [...new Set(transactions.map((transaction) => transaction.userId))];
      const users = await User.find({ userId: { $in: userIds } })
        .select('userId displayName email image')
        .lean();
      const userMap = new Map(users.map((user: any) => [user.userId, user]));

      const enrichedTransactions = transactions.map((transaction) => {
        const user = userMap.get(transaction.userId) as any;
        return {
          ...transaction,
          displayName: user?.displayName || 'N/A',
          email: user?.email || 'N/A',
          image: user?.image || null,
        };
      });

      return res.json({
        success: true,
        data: {
          paidCustomerCount: userIds.length,
          transactionCount: enrichedTransactions.length,
          totalRevenue: enrichedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
          period: {
            from: startOfPreviousMonth,
            to: now,
          },
          transactions: enrichedTransactions,
        },
      });
    } catch (error: any) {
      console.error('[PaidCustomers] Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/system/dashboard-stats
  getDashboardStats: async (req: Request, res: Response) => {
    try {
      const User = require('../models/user.model').default;
      const Trip = require('../models/trip.model').default;
      const Booking = require('../models/booking.model').default;
      const Order = require('../models/order.model').default;
      const CreatorSubscriptionTransaction = require('../models/creatorSubscriptionTransaction.model').default;

      const Hotel = require('../models/hotel.model').default;
      const HotelRequest = require('../models/hotelRequest.model').default;
      const WithdrawalRequest = require('../models/withdrawalRequest.model').default;
      const Wallet = require('../models/wallet.model').default;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      // Drop stale unique index on userId if exists (one-time fix)
      try {
        await Wallet.collection.dropIndex('userId_1');
      } catch (e) {
        // index already dropped or doesn't exist, ignore
      }

      // Execute all base statistics and aggregations in parallel (reducing roundtrips from ~68 to just 2)
      const [
        totalUsers,
        usersLastMonth,
        totalHotels,
        hotelsLastMonth,
        pendingHotelRequests,
        pendingWithdrawals,
        tripsThisMonth,
        tripsLastMonth,
        bookingRevenue,
        orderRevenue,
        creatorRevenue,
        bookingRevenueThisMonth,
        orderRevenueThisMonth,
        creatorRevenueThisMonth,
        bookingRevenueLastMonth,
        orderRevenueLastMonth,
        creatorRevenueLastMonth,
        totalBookings,
        bookingsThisMonth,
        bookingsLastMonth,
        recentBookings,
        bMonthly,
        oMonthly,
        cMonthly,
        adminWallet
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $lt: startOfMonth } }),
        Hotel.countDocuments(),
        Hotel.countDocuments({ createdAt: { $lt: startOfMonth } }),
        HotelRequest.countDocuments({ status: 'pending' }),
        WithdrawalRequest.countDocuments({ status: 'pending' }),
        Trip.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Trip.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
        Booking.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        Order.aggregate([
          { $match: { status: 'SUCCESS' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        CreatorSubscriptionTransaction.aggregate([
          { $match: { status: 'success' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Booking.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        Order.aggregate([
          { $match: { status: 'SUCCESS', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        CreatorSubscriptionTransaction.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Booking.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        Order.aggregate([
          { $match: { status: 'SUCCESS', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        CreatorSubscriptionTransaction.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Booking.countDocuments(),
        Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Booking.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
        Booking.find().sort({ createdAt: -1 }).limit(5).lean(),
        Booking.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: startOf12MonthsAgo } } },
          { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$totalPrice' } } }
        ]),
        Order.aggregate([
          { $match: { status: 'SUCCESS', createdAt: { $gte: startOf12MonthsAgo } } },
          { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$amount' } } }
        ]),
        CreatorSubscriptionTransaction.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOf12MonthsAgo } } },
          { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$amount' } } }
        ]),
        Wallet.findOne({ isSystem: true })
      ]);

      // Calculate percentage changes
      const usersChange = usersLastMonth > 0 ? Math.round(((totalUsers - usersLastMonth) / usersLastMonth) * 100) : 0;
      const hotelsChange = hotelsLastMonth > 0 ? Math.round(((totalHotels - hotelsLastMonth) / hotelsLastMonth) * 100) : 0;
      const tripsChange = tripsLastMonth > 0 ? Math.round(((tripsThisMonth - tripsLastMonth) / tripsLastMonth) * 100) : 0;
      const bookingsChange = bookingsLastMonth > 0 ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100) : 0;

      // Revenue totals (bookings commission is 10%)
      const totalBookingRevenue = (bookingRevenue[0]?.total || 0) * 0.1;
      const totalOrderRevenue = orderRevenue[0]?.total || 0;
      const totalCreatorRevenue = creatorRevenue[0]?.total || 0;
      const totalRevenue = totalBookingRevenue + totalOrderRevenue + totalCreatorRevenue;

      // Revenue this month
      const revenueThisMonth =
        ((bookingRevenueThisMonth[0]?.total || 0) * 0.1) +
        (orderRevenueThisMonth[0]?.total || 0) +
        (creatorRevenueThisMonth[0]?.total || 0);

      // Revenue last month
      const revLastMonth =
        ((bookingRevenueLastMonth[0]?.total || 0) * 0.1) +
        (orderRevenueLastMonth[0]?.total || 0) +
        (creatorRevenueLastMonth[0]?.total || 0);
      const revenueChange = revLastMonth > 0 ? Math.round(((revenueThisMonth - revLastMonth) / revLastMonth) * 100) : 0;

      // Batch query details for recent bookings to prevent N+1 queries
      const userIds = recentBookings.map((b: any) => b.userId);
      const hotelIds = recentBookings.map((b: any) => b.hotelId);

      const [usersList, hotelsList] = await Promise.all([
        User.find({ userId: { $in: userIds } }).lean(),
        Hotel.find({ hotelId: { $in: hotelIds } }).lean()
      ]);

      const userMap = new Map<string, any>(usersList.map((u: any) => [u.userId, u]));
      const hotelMap = new Map<string, any>(hotelsList.map((h: any) => [h.hotelId, h]));

      const populatedBookings = recentBookings.map((b: any) => {
        const user = userMap.get(b.userId);
        const hotel = hotelMap.get(b.hotelId);
        return {
          id: b.bookingId,
          user: user?.displayName || b.guestInfo?.fullName || 'N/A',
          userAvatar: user?.image || null,
          destination: hotel?.name || 'N/A',
          date: new Date(b.createdAt).toLocaleDateString('vi-VN'),
          amount: b.totalPrice,
          status: b.status === 'confirmed' || b.status === 'completed' ? 'Hoàn thành'
            : b.status === 'pending' ? 'Đang xử lý'
              : b.status === 'cancelled' ? 'Hủy' : b.status,
        };
      });

      // Map monthly stats efficiently in memory
      const bMap = new Map<string, number>(bMonthly.map((item: any) => [`${item._id.year}-${item._id.month}`, item.total || 0]));
      const oMap = new Map<string, number>(oMonthly.map((item: any) => [`${item._id.year}-${item._id.month}`, item.total || 0]));
      const cMap = new Map<string, number>(cMonthly.map((item: any) => [`${item._id.year}-${item._id.month}`, item.total || 0]));

      const monthlyRevenueList: number[] = [];
      const monthlyRevenueBreakdown: { booking: number; order: number; creator: number; total: number; }[] = [];

      for (let i = 11; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth() + 1; // 1-indexed
        const key = `${y}-${m}`;

        const bookingVal = (bMap.get(key) || 0) * 0.1;
        const orderVal = oMap.get(key) || 0;
        const creatorVal = cMap.get(key) || 0;
        const totalVal = bookingVal + orderVal + creatorVal;

        monthlyRevenueList.push(totalVal);
        monthlyRevenueBreakdown.push({
          booking: bookingVal,
          order: orderVal,
          creator: creatorVal,
          total: totalVal
        });
      }

      const adminWalletBalance = (adminWallet as any)?.balance || 0;

      res.json({
        success: true,
        data: {
          totalUsers,
          usersChange,
          totalHotels,
          hotelsChange,
          pendingHotelRequests,
          pendingWithdrawals,
          tripsThisMonth,
          tripsChange,
          totalRevenue,
          totalBookingRevenue,
          totalOrderRevenue,
          totalCreatorRevenue,
          revenueThisMonth,
          revenueChange,
          totalBookings,
          bookingsThisMonth,
          bookingsChange,
          recentBookings: populatedBookings,
          monthlyRevenue: monthlyRevenueList,
          monthlyRevenueBreakdown,
          adminWalletBalance,
        }
      });
    } catch (error: any) {
      console.error('[Dashboard] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/system/hotel-owners
  getHotelOwners: async (req: Request, res: Response) => {
    try {
      const User = require('../models/user.model').default;
      const Hotel = require('../models/hotel.model').default;
      const Booking = require('../models/booking.model').default;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const skip = (page - 1) * limit;

      const userFilter: any = { role: 'hotel_owner' };
      if (search) {
        userFilter.$or = [
          { displayName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const [owners, total] = await Promise.all([
        User.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(userFilter),
      ]);

      const enriched = await Promise.all(
        owners.map(async (owner: any) => {
          const hotels = await Hotel.find({ ownerId: owner.userId })
            .select('hotelId name address.city starRating reviewSummary images')
            .lean();

          const hotelIds = hotels.map((h: any) => h.hotelId);

          const bookingStats = await Booking.aggregate([
            { $match: { hotelId: { $in: hotelIds } } },
            {
              $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                totalRevenue: {
                  $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] }
                },
                paidBookings: {
                  $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
                }
              }
            }
          ]);

          const stats = bookingStats[0] || { totalBookings: 0, totalRevenue: 0, paidBookings: 0 };

          return {
            userId: owner.userId,
            displayName: owner.displayName,
            email: owner.email,
            image: owner.image,
            phone: owner.phone,
            createdAt: owner.createdAt,
            hotelCount: hotels.length,
            hotels: hotels.map((h: any) => ({
              hotelId: h.hotelId,
              name: h.name,
              city: h.address?.city || 'N/A',
              starRating: h.starRating,
              reviewScore: h.reviewSummary?.score || 0,
              reviewCount: h.reviewSummary?.count || 0,
              thumbnail: h.images?.[0] || null,
            })),
            totalBookings: stats.totalBookings,
            paidBookings: stats.paidBookings,
            totalRevenue: stats.totalRevenue,
          };
        })
      );

      res.json({
        success: true,
        data: enriched,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      console.error('[HotelOwners] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/system/point-topups
  getPointTopups: async (req: Request, res: Response) => {
    try {
      const Topup = require('../models/topup.model').default;
      const User = require('../models/user.model').default;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const skip = (page - 1) * limit;

      // Lọc các giao dịch nạp điểm từ store (bookingId bắt đầu bằng "topup_points_")
      const filter: any = {
        bookingId: { $regex: /^topup_points_/ }
      };
      if (status && ['pending', 'paid', 'cancelled'].includes(status)) {
        filter.status = status;
      }

      const [transactions, total] = await Promise.all([
        Topup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Topup.countDocuments(filter),
      ]);

      // Join thông tin user
      const enriched = await Promise.all(
        transactions.map(async (t: any) => {
          const user = await User.findOne({ userId: t.userId }).select('displayName email').lean();
          return {
            _id: t._id,
            bookingId: t.bookingId,
            orderCode: t.orderCode,
            userId: t.userId,
            displayName: (user as any)?.displayName || 'N/A',
            email: (user as any)?.email || 'N/A',
            amount: t.amount,
            pointsEarned: Math.floor(t.amount / 1000), // 1,000 VND = 1 điểm
            status: t.status,
            createdAt: t.createdAt,
          };
        })
      );

      res.json({
        success: true,
        data: enriched,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('[PointTopups] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // POST /api/system/upload-image
  // Upload ảnh lên Cloudinary, trả về URL
  uploadImage: async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'Không có file nào được gửi lên' });
      }
      // multer-storage-cloudinary đã upload xong, URL nằm ở file.path
      const imageUrl = file.path || file.secure_url;
      res.json({ success: true, url: imageUrl });
    } catch (error: any) {
      console.error('[UploadImage] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

