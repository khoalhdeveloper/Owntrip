# 🧪 HƯỚNG DẪN TEST BOOKING FLOW

## 📌 Prerequisites

1. Đảm bảo server đang chạy: `npm start` hoặc `npm run dev`
2. Đã có MongoDB connection
3. Đã có User account và đã login để lấy JWT token
4. Đã có ít nhất 1 Hotel và RoomInventory data

---

## 🔐 Bước 0: Đăng nhập để lấy JWT Token

### Request:
```http
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "UserId001",
    "displayName": "Nguyen Van A"
  }
}
```

**📝 Lưu token này để dùng cho các request tiếp theo!**

---

## 🏨 Bước 1: Tạo dữ liệu mẫu Hotel (Nếu chưa có)

### Request:
```http
POST http://localhost:3000/api/hotels/create
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "name": "Vinpearl Luxury Landmark 81",
  "starRating": 5,
  "address": {
    "fullAddress": "720A Đ. Điện Biên Phủ, Vinhomes Tân Cảng, Bình Thạnh, TP.HCM",
    "city": "Ho Chi Minh",
    "coordinates": {
      "lat": 10.7944,
      "lng": 106.7218
    }
  },
  "images": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
  ],
  "description": "Khách sạn 5 sao cao cấp với view toàn thành phố",
  "rooms": [
    {
      "roomTypeId": "DeluxeKing",
      "name": "Deluxe King Room",
      "description": "Phòng Deluxe với giường King size",
      "images": ["https://images.unsplash.com/photo-1590490360182-c33d57733427"],
      "capacity": 2,
      "basePrice": 3500000,
      "amenities": ["Wifi", "TV", "Minibar", "Balcony"]
    },
    {
      "roomTypeId": "SuiteFamiliy",
      "name": "Family Suite",
      "description": "Suite rộng rãi cho gia đình",
      "images": ["https://images.unsplash.com/photo-1611892440504-42a792e24d32"],
      "capacity": 4,
      "basePrice": 6000000,
      "amenities": ["Wifi", "TV", "Kitchen", "Living Room"]
    }
  ],
  "tags": ["Bán chạy nhất", "Giá tốt 2026"]
}
```

**📌 Ghi nhớ `hotelId` trả về (VD: HotelId001)**

---

## 📅 Bước 2: Tạo RoomInventory (Tồn kho phòng theo ngày)

Bạn cần tạo inventory cho từng ngày. Ví dụ tạo cho 7 ngày tới:

### Request (Tạo bằng MongoDB Compass hoặc script):
```javascript
// Chạy trong MongoDB Compass hoặc Mongo Shell
const mongoose = require('mongoose');
const RoomInventory = require('./models/roomInventory.model').default;

async function seedInventory() {
  const hotelId = 'HotelId001';
  const roomTypes = [
    { id: 'DeluxeKing', total: 10, price: 3500000 },
    { id: 'SuiteFamiliy', total: 5, price: 6000000 }
  ];

  // Tạo inventory cho 30 ngày tới
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    for (const room of roomTypes) {
      await RoomInventory.create({
        hotelId,
        roomTypeId: room.id,
        date,
        totalInventory: room.total,
        bookedCount: 0,
        priceAtDate: room.price,
        status: 'available'
      });
    }
  }
  console.log('✅ Seed inventory thành công!');
}

seedInventory();
```

**Hoặc tạo thủ công 1 record mẫu:**
```http
POST http://localhost:27017
// Insert vào collection roomInventories

{
  "hotelId": "HotelId001",
  "roomTypeId": "DeluxeKing",
  "date": ISODate("2026-03-15T00:00:00.000Z"),
  "totalInventory": 10,
  "bookedCount": 0,
  "priceAtDate": 3500000,
  "status": "available"
}
```

---

## ✅ Bước 3: TEST API KIỂM TRA PHÒNG TRỐNG

### Request:
```http
POST http://localhost:3000/api/bookings/check-availability
Content-Type: application/json

{
  "hotelId": "HotelId001",
  "roomTypeId": "DeluxeKing",
  "checkIn": "2026-03-15",
  "checkOut": "2026-03-17",
  "roomCount": 2
}
```

### Expected Response:
```json
{
  "success": true,
  "available": true,
  "totalPrice": 14000000,
  "nights": 2,
  "breakdown": [
    {
      "date": "2026-03-15",
      "price": 3500000,
      "available": 10,
      "status": "available"
    },
    {
      "date": "2026-03-16",
      "price": 3500000,
      "available": 10,
      "status": "available"
    }
  ],
  "message": "Phòng còn trống, bạn có thể đặt!"
}
```

---

## 🎉 Bước 4: TEST API TẠO ĐẶT PHÒNG

### Request:
```http
POST http://localhost:3000/api/bookings/create
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "hotelId": "HotelId001",
  "roomTypeId": "DeluxeKing",
  "checkIn": "2026-03-15",
  "checkOut": "2026-03-17",
  "roomCount": 2,
  "guestInfo": {
    "fullName": "Nguyen Van A",
    "phone": "0901234567",
    "email": "nguyenvana@gmail.com",
    "specialRequests": "Muốn phòng tầng cao, view đẹp"
  },
  "paymentMethod": "balance"
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Đặt phòng thành công!",
  "data": {
    "bookingId": "BookingId001",
    "totalPrice": 14000000,
    "status": "confirmed"
  }
}
```

### ⚠️ Lưu ý:
- User phải có đủ `balance >= 14000000` trong database
- Nếu không đủ tiền, sẽ báo lỗi: "Số dư không đủ"

**Cách nạp tiền cho user (chạy trực tiếp trong MongoDB):**
```javascript
db.users.updateOne(
  { userId: "UserId001" },
  { $set: { balance: 50000000 } }
)
```

---

## 📜 Bước 5: TEST API XEM LỊCH SỬ ĐẶT PHÒNG

### Request:
```http
GET http://localhost:3000/api/bookings/my-bookings?page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

### Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "BookingId001",
      "hotel": {
        "name": "Vinpearl Luxury Landmark 81",
        "address": "720A Đ. Điện Biên Phủ...",
        "image": "https://images.unsplash.com/...",
        "stars": 5
      },
      "checkIn": "2026-03-15T00:00:00.000Z",
      "checkOut": "2026-03-17T00:00:00.000Z",
      "roomCount": 2,
      "totalPrice": 14000000,
      "status": "confirmed",
      "createdAt": "2026-02-05T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 🔍 Bước 6: TEST API XEM CHI TIẾT BOOKING

### Request:
```http
GET http://localhost:3000/api/bookings/BookingId001
Authorization: Bearer YOUR_JWT_TOKEN
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "bookingId": "BookingId001",
    "userId": "UserId001",
    "hotelId": "HotelId001",
    "roomTypeId": "DeluxeKing",
    "checkIn": "2026-03-15T00:00:00.000Z",
    "checkOut": "2026-03-17T00:00:00.000Z",
    "nights": 2,
    "roomCount": 2,
    "totalPrice": 14000000,
    "status": "confirmed",
    "guestInfo": {
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "email": "nguyenvana@gmail.com",
      "specialRequests": "Muốn phòng tầng cao, view đẹp"
    },
    "paymentMethod": "balance",
    "paymentStatus": "paid",
    "hotel": {
      "name": "Vinpearl Luxury Landmark 81",
      "address": { ... },
      "images": [...],
      "stars": 5
    }
  }
}
```

---

## ❌ Bước 7: TEST API HỦY ĐẶT PHÒNG

### Request:
```http
POST http://localhost:3000/api/bookings/BookingId001/cancel
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "reason": "Lịch trình thay đổi, không đi được"
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Hủy đặt phòng thành công!",
  "data": {
    "refundAmount": 14000000,
    "refundPercentage": "100%"
  }
}
```

**📌 Chính sách hoàn tiền:**
- Hủy trước 24h: Hoàn 100%
- Hủy trong vòng 24h: Hoàn 50%

---

## 🐛 Common Errors & Solutions

### Error 1: "Số dư không đủ"
**Giải pháp:** Nạp thêm tiền cho user
```javascript
db.users.updateOne(
  { userId: "UserId001" },
  { $inc: { balance: 50000000 } }
)
```

### Error 2: "Không tìm thấy thông tin tồn kho"
**Giải pháp:** Tạo RoomInventory cho ngày đó
```javascript
await RoomInventory.create({
  hotelId: "HotelId001",
  roomTypeId: "DeluxeKing",
  date: new Date("2026-03-15"),
  totalInventory: 10,
  bookedCount: 0,
  priceAtDate: 3500000,
  status: "available"
});
```

### Error 3: "Route not found"
**Giải pháp:** Kiểm tra lại `app.js` đã import và use booking route chưa

### Error 4: "JWT token invalid"
**Giải pháp:** Login lại để lấy token mới

---

## 📊 Kiểm tra Database sau khi đặt phòng

### 1. Kiểm tra Booking đã tạo:
```javascript
db.bookings.find({ userId: "UserId001" })
```

### 2. Kiểm tra bookedCount đã tăng:
```javascript
db.roominventories.find({ 
  hotelId: "HotelId001",
  date: { $gte: ISODate("2026-03-15"), $lt: ISODate("2026-03-17") }
})
```

### 3. Kiểm tra balance đã bị trừ:
```javascript
db.users.findOne({ userId: "UserId001" }, { balance: 1, points: 1 })
```

---

## 🎯 Testing Checklist

- [ ] ✅ Check availability - Phòng còn trống
- [ ] ❌ Check availability - Hết phòng
- [ ] ✅ Create booking - Đủ tiền
- [ ] ❌ Create booking - Không đủ tiền
- [ ] ✅ Create booking - Tự động trừ tiền & tích điểm
- [ ] ✅ Create booking - bookedCount tăng đúng
- [ ] ✅ Get my bookings - Pagination
- [ ] ✅ Get booking detail
- [ ] ✅ Cancel booking - Hoàn 100%
- [ ] ✅ Cancel booking - Hoàn 50%
- [ ] ❌ Cancel booking - Đã hủy rồi

---

## 🚀 Next Steps

1. Test frontend integration với React/Vue
2. Test concurrent booking (2 user đặt cùng lúc)
3. Setup email notification
4. Implement payment gateway (VNPay, Momo)
5. Add booking analytics dashboard
