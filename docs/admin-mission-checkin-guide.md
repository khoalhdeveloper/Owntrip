# Admin Guide: Mission, Check-in Place, Check-in Frame

Tài liệu này dành cho Admin FE khi làm màn hình quản lý nhiệm vụ check-in.

## Mục Tiêu

Admin có thể:

- Tạo frame phần thưởng cho check-in.
- Bật/tắt địa điểm được phép check-in.
- Tạo mission gồm nhiều địa điểm cần check-in.
- Chọn reward cho mission: `points`, `souvenir`, hoặc `checkin_frame`.
- Bật/tắt/xóa/cập nhật mission.

## Auth

Tất cả API admin cần:

```http
Authorization: Bearer <admin_access_token>
```

User phải có role:

```ts
role: "admin"
```

## Quản Lý Frame Phần Thưởng

Admin đã có màn hình Frames.

Khi tạo frame dùng làm phần thưởng mission, chọn:

```txt
Cách mở khóa = Quà mission
```

Field BE tương ứng:

```ts
unlockType: "mission"
```

Frame miễn phí cho mọi user:

```ts
unlockType: "free"
```

Mission reward frame sẽ dùng `_id` của frame:

```json
{
  "type": "checkin_frame",
  "frameId": "frame_123"
}
```

## Quản Lý Mission

### Lấy tất cả mission cho admin

```http
GET /api/missions/admin
Authorization: Bearer <admin_access_token>
```

Response:

```json
{
  "success": true,
  "total": 1,
  "missions": [
    {
      "_id": "mission_123",
      "title": "Check-in Vũng Tàu",
      "description": "Check-in đủ các địa điểm ở Vũng Tàu",
      "requiredPlaceIds": ["place_1", "place_2"],
      "reward": {
        "type": "checkin_frame",
        "frameId": "frame_123"
      },
      "isActive": true,
      "order": 1
    }
  ]
}
```

### Tạo mission

```http
POST /api/missions
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Payload reward frame:

```json
{
  "title": "Check-in Vũng Tàu",
  "description": "Check-in đủ các địa điểm ở Vũng Tàu",
  "imageUrl": "https://...",
  "requiredPlaceIds": ["place_1", "place_2"],
  "reward": {
    "type": "checkin_frame",
    "frameId": "frame_123"
  },
  "isActive": true,
  "order": 1,
  "startsAt": "2026-06-15T00:00:00.000Z",
  "endsAt": "2026-12-31T23:59:59.999Z"
}
```

Payload reward điểm:

```json
{
  "title": "Check-in trung tâm thành phố",
  "description": "Hoàn thành một địa điểm bất kỳ trong trung tâm",
  "requiredPlaceIds": ["place_1"],
  "reward": {
    "type": "points",
    "pointsAmount": 100
  },
  "isActive": true,
  "order": 2
}
```

Payload reward souvenir:

```json
{
  "title": "Sưu tầm kỷ niệm Đà Nẵng",
  "requiredPlaceIds": ["place_1", "place_2"],
  "reward": {
    "type": "souvenir",
    "souvenirId": "souvenir_123"
  },
  "isActive": true
}
```

Response:

```json
{
  "success": true,
  "message": "Tao nhiem vu thanh cong",
  "mission": {}
}
```

### Cập nhật mission

```http
PUT /api/missions/:id
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Payload có thể gửi một phần:

```json
{
  "title": "Tên nhiệm vụ mới",
  "requiredPlaceIds": ["place_1", "place_3"],
  "order": 5
}
```

### Bật/tắt mission

```http
PATCH /api/missions/:id/toggle
Authorization: Bearer <admin_access_token>
```

API này đảo `isActive`.

### Xóa mission

```http
DELETE /api/missions/:id
Authorization: Bearer <admin_access_token>
```

## Validation BE Đang Có

BE sẽ reject nếu:

- Thiếu `title` khi tạo mission.
- `requiredPlaceIds` rỗng.
- `reward.type` không thuộc:

```ts
"points" | "souvenir" | "checkin_frame"
```

- `reward.type = "checkin_frame"` nhưng thiếu `frameId`.
- `reward.type = "points"` nhưng `pointsAmount <= 0`.
- `reward.type = "souvenir"` nhưng thiếu `souvenirId`.
- `startsAt` hoặc `endsAt` không parse được thành ngày hợp lệ.

Error response mẫu:

```json
{
  "success": false,
  "code": "missing_reward_frame",
  "message": "checkin_frame reward requires frameId"
}
```

## Place Và Check-in Enabled

Mission dùng:

```ts
requiredPlaceIds: string[]
```

Mỗi item là `placeId` của collection `Place`.

Địa điểm chỉ check-in được nếu:

```ts
isCheckinEnabled !== false
```

Hiện BE xem place cũ chưa có field `isCheckinEnabled` là được phép check-in. Nếu admin muốn khóa check-in cho một place, set:

```ts
isCheckinEnabled: false
```

## Admin UI Gợi Ý

Nên có màn hình:

```txt
admin/src/pages/Missions.tsx
```

Form field:

- `title`
- `description`
- `imageUrl`
- `requiredPlaceIds`
- `reward.type`
- `reward.pointsAmount`
- `reward.frameId`
- `reward.souvenirId`
- `startsAt`
- `endsAt`
- `order`
- `isActive`

Gợi ý UI:

- Chọn địa điểm bằng searchable select từ `Place`.
- Chọn frame reward bằng searchable select từ Frames có `unlockType = "mission"`.
- Hiển thị badge reward:
  - `points`
  - `souvenir`
  - `checkin_frame`
- Có toggle active.

## Checklist Admin FE

- [ ] Tạo trang Missions trong admin.
- [ ] Gọi `GET /api/missions/admin`.
- [ ] Form tạo mission gọi `POST /api/missions`.
- [ ] Form sửa mission gọi `PUT /api/missions/:id`.
- [ ] Toggle active gọi `PATCH /api/missions/:id/toggle`.
- [ ] Xóa mission gọi `DELETE /api/missions/:id`.
- [ ] Validate FE trước khi submit: title, requiredPlaceIds, reward.
- [ ] Khi reward là `checkin_frame`, bắt buộc chọn frame.
- [ ] Khi reward là `points`, bắt buộc nhập pointsAmount > 0.
