/**
 * Script tạo dữ liệu mẫu để test Booking Flow
 * Chạy: node utils/seedBookingData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hotel = require('../models/hotel.model').default;
const RoomInventory = require('../models/roomInventory.model').default;
const User = require('../models/user.model').default;

const seedBookingData = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/owntrip');
    console.log('✅ Connected to MongoDB');

    // 1. Tạo User mẫu với balance
    console.log('\n📝 Creating sample user...');
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    
    let userId;
    if (existingUser) {
      userId = existingUser.userId;
      console.log(`ℹ️  User already exists: ${userId}`);
      // Cập nhật balance
      await User.updateOne(
        { userId },
        { $set: { balance: 50000000, points: 1000 } }
      );
      console.log('✅ Updated balance to 50,000,000 VND');
    } else {
      const newUser = await User.create({
        email: 'testuser@example.com',
        password: 'Test123456',
        displayName: 'Test User',
        balance: 50000000, // 50 triệu VND
        points: 1000,
        isVerified: true,
        role: 'user'
      });
      userId = newUser.userId;
      console.log(`✅ Created user: ${userId}`);
      console.log(`   Email: testuser@example.com`);
      console.log(`   Password: Test123456`);
      console.log(`   Balance: 50,000,000 VND`);
    }

    // 2. Tạo Hotel mẫu
    console.log('\n🏨 Creating sample hotel...');
    const existingHotel = await Hotel.findOne({ name: 'Vinpearl Luxury Landmark 81' });
    
    let hotelId;
    if (existingHotel) {
      hotelId = existingHotel.hotelId;
      console.log(`ℹ️  Hotel already exists: ${hotelId}`);
    } else {
      const newHotel = await Hotel.create({
        name: 'Vinpearl Luxury Landmark 81',
        starRating: 5,
        address: {
          fullAddress: '720A Đ. Điện Biên Phủ, Vinhomes Tân Cảng, Bình Thạnh, TP.HCM',
          city: 'Ho Chi Minh',
          coordinates: {
            lat: 10.7944,
            lng: 106.7218
          }
        },
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'
        ],
        description: 'Khách sạn 5 sao cao cấp với view toàn thành phố từ tầng 48-71 của tòa nhà Landmark 81',
        rooms: [
          {
            roomTypeId: 'DeluxeKing',
            name: 'Deluxe King Room',
            description: 'Phòng Deluxe với giường King size, view thành phố tuyệt đẹp',
            images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427'],
            capacity: 2,
            basePrice: 3500000,
            amenities: ['Wifi miễn phí', 'Smart TV 55"', 'Minibar', 'Ban công riêng', 'Bồn tắm']
          },
          {
            roomTypeId: 'SuiteFamily',
            name: 'Family Suite',
            description: 'Suite rộng rãi với 2 phòng ngủ riêng biệt, phù hợp cho gia đình',
            images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32'],
            capacity: 4,
            basePrice: 6000000,
            amenities: ['Wifi miễn phí', 'Smart TV', 'Bếp nhỏ', 'Phòng khách', 'Máy giặt']
          },
          {
            roomTypeId: 'PresidentialSuite',
            name: 'Presidential Suite',
            description: 'Suite cao cấp nhất với diện tích 150m2, view 270 độ',
            images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461'],
            capacity: 6,
            basePrice: 15000000,
            amenities: ['Phòng khách riêng', 'Bếp đầy đủ', 'Jacuzzi', 'Phòng gym mini', 'Butler 24/7']
          }
        ],
        tags: ['Bán chạy nhất', 'Giá tốt 2026', 'View đẹp'],
        reviewSummary: {
          score: 9.2,
          count: 1250,
          cleanliness: 9.5,
          service: 9.0,
          facilities: 9.3,
          valueForMoney: 8.8
        }
      });
      hotelId = newHotel.hotelId;
      console.log(`✅ Created hotel: ${hotelId}`);
    }

    // 3. Tạo Room Inventory cho 60 ngày tới
    console.log('\n📅 Creating room inventory for 60 days...');
    
    const roomTypes = [
      { id: 'DeluxeKing', total: 20, basePrice: 3500000 },
      { id: 'SuiteFamily', total: 10, basePrice: 6000000 },
      { id: 'PresidentialSuite', total: 3, basePrice: 15000000 }
    ];

    let inventoryCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      for (const room of roomTypes) {
        // Kiểm tra đã tồn tại chưa
        const exists = await RoomInventory.findOne({
          hotelId,
          roomTypeId: room.id,
          date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999))
          }
        });

        if (!exists) {
          // Dynamic pricing: Cuối tuần tăng giá 20%
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const priceMultiplier = isWeekend ? 1.2 : 1.0;

          await RoomInventory.create({
            hotelId,
            roomTypeId: room.id,
            date: new Date(date),
            totalInventory: room.total,
            bookedCount: 0,
            priceAtDate: Math.floor(room.basePrice * priceMultiplier),
            status: 'available'
          });
          inventoryCreated++;
        }
      }
    }

    console.log(`✅ Created ${inventoryCreated} inventory records`);

    // 4. In ra thông tin tổng hợp
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED DATA COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n📋 TEST CREDENTIALS:');
    console.log(`   Email: testuser@example.com`);
    console.log(`   Password: Test123456`);
    console.log(`   Balance: 50,000,000 VND`);
    console.log('\n🏨 SAMPLE HOTEL:');
    console.log(`   Hotel ID: ${hotelId}`);
    console.log(`   Name: Vinpearl Luxury Landmark 81`);
    console.log(`   Room Types: DeluxeKing, SuiteFamily, PresidentialSuite`);
    console.log('\n📅 INVENTORY:');
    console.log(`   Available dates: Next 60 days from today`);
    console.log(`   Weekend prices: +20%`);
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Login với account test để lấy JWT token');
    console.log('   2. Kiểm tra phòng trống: POST /api/bookings/check-availability');
    console.log('   3. Tạo booking: POST /api/bookings/create');
    console.log('\n   Chi tiết xem file: TESTING_GUIDE.md');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Chạy script
seedBookingData();
