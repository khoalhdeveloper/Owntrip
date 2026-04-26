# Owntrip

## 🚀 QUICK START - LUỒNG ĐẶT PHÒNG KHÁCH SẠN

### ✅ Hệ thống đã triển khai

Hệ thống đặt phòng khách sạn hoàn chỉnh với các tính năng:
- ✅ Kiểm tra phòng trống theo ngày
- ✅ Đặt phòng với ACID Transaction
- ✅ Thanh toán & tích điểm tự động
- ✅ Xem lịch sử đặt phòng
- ✅ Hủy đặt phòng với chính sách hoàn tiền
- ✅ Email xác nhận tự động
- ✅ Quản lý Inventory (tồn kho phòng) qua API

---

## 📁 Cấu trúc dự án

```
Owntrip/
├── BE/
│   ├── models/
│   │   ├── booking.model.ts        ← ✨ MỚI
│   │   ├── hotel.model.ts          ← Đã cập nhật
│   │   ├── roomInventory.model.ts
│   │   └── user.model.ts
│   ├── controllers/
│   │   ├── booking.controller.ts   ← ✨ MỚI (5 APIs)
│   │   ├── inventory.controller.ts ← ✨ MỚI (6 APIs)
│   │   └── hotel.controller.ts
│   ├── routes/
│   │   ├── booking.route.ts        ← ✨ MỚI
│   │   ├── inventory.route.ts      ← ✨ MỚI
│   │   └── hotel.route.ts
│   ├── interfaces/
│   │   ├── booking.interface.ts    ← ✨ MỚI
│   │   └── hotel.interface.ts      ← Đã cập nhật
│   ├── utils/
│   │   └── seedBookingData.js      ← ✨ MỚI (Script test)
│   ├── INVENTORY_API.md            ← ✨ Hướng dẫn Inventory API
│   ├── BOOKING_FLOW.md             ← ✨ Tài liệu chi tiết
│   ├── TESTING_GUIDE.md            ← ✨ Hướng dẫn test
│   └── app.js                      ← Đã đăng ký booking routes
└── README.md
```

---

## 🎯 Bắt đầu trong 3 bước

### Bước 1: Tạo dữ liệu test

```powershell
cd BE
node utils/seedBookingData.js
```

**Kết quả:**
- 👤 User: `testuser@example.com` / `Test123456` (Balance: 50 triệu VND)
- 🏨 Hotel: Vinpearl Luxury Landmark 81
- 📅 Inventory: 60 ngày tới (3 loại phòng)

### Bước 2: Chạy server

```powershell
npm install
npm start
```

### Bước 3: Test API

#### 1. Login
```http
POST http://localhost:3000/api/users/login
Content-Type: application/json

{"email": "testuser@example.com", "password": "Test123456"}
```

#### 2. Kiểm tra phòng
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

#### 3. Đặt phòng
```http
POST http://localhost:3000/api/bookings/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "hotelId": "HotelId001",
  "roomTypeId": "DeluxeKing",
  "checkIn": "2026-03-15",
  "checkOut": "2026-03-17",
  "roomCount": 2,
  "guestInfo": {
    "fullName": "Nguyen Van A",
    "phone": "0901234567",
    "email": "test@gmail.com"
  },
  "paymentMethod": "balance"
}
```

---

## 🎨 API Endpoints
### Booking APIs
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/bookings/check-availability` | ❌ | Kiểm tra phòng trống |
| POST | `/api/bookings/create` | ✅ | Tạo đơn đặt phòng |
| GET | `/api/bookings/my-bookings` | ✅ | Lịch sử đặt phòng |
| GET | `/api/bookings/:id` | ✅ | Chi tiết booking |
| POST | `/api/bookings/:id/cancel` | ✅ | Hủy đặt phòng |

### Inventory APIs (Quản lý tồn kho)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/inventory/bulk-create` | ✅ | Tạo inventory hàng loạt |
| GET | `/api/inventory` | ❌ | Xem inventory theo filter |
- **[INVENTORY_API.md](BE/INVENTORY_API.md)** - Hướng dẫn quản lý tồn kho phòng qua API
| PUT | `/api/inventory/:id` | ✅ | Cập nhật 1 inventory |
| POST | `/api/inventory/bulk-price-update` | ✅ | Cập nhật giá hàng loạt |
| DELETE | `/api/inventory` | ✅ | Xóa inventory |
| GET | `/api/inventory/dashboard` | ❌ | Dashboard thống kê
| POST | `/api/bookings/:id/cancel` | ✅ | Hủy đặt phòng |

---

## 📚 Tài liệu chi tiết

- **[BOOKING_FLOW.md](BE/BOOKING_FLOW.md)** - Kiến trúc hệ thống, database schema, best practices
- **[TESTING_GUIDE.md](BE/TESTING_GUIDE.md)** - Hướng dẫn test chi tiết từng API, troubleshooting

---

## 🔄 Luồng đặt phòng

```
User tìm kiếm
    ↓
Kiểm tra phòng trống (check-availability)
    ↓
Đặt phòng (create) → Transaction:
  ├─ Kiểm tra balance
  ├─ Tạo Booking
  ├─ Tăng bookedCount
  ├─ Trừ tiền + Tích điểm
  └─ Gửi email
    ↓
Xem lịch sử (my-bookings)
    ↓
[Optional] Hủy (cancel) → Hoàn tiền
```

---

## 💡 Quick Tips

### Nạp tiền cho user (MongoDB):
```javascript
db.users.updateOne({userId: "UserId001"}, {$inc: {balance: 50000000}})
```

### Reset bookings:
```javascript
db.bookings.deleteMany({})
db.roominventories.updateMany({}, {$set: {bookedCount: 0}})
```

---

## 🚀 Next Steps

- [ ] Frontend integration (React/Vue)
- [ ] Payment gateway (VNPay, Momo)
- [ ] Coupon system
- [ ] Admin dashboard
- [ ] Real-time notifications

---

Happy Booking! 🎉
