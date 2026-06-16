# User Guide: Location Check-in, Mission Progress, Check-in Frame

Tài liệu này dành cho User FE/mobile app khi gắn tab Check-in, Missions, Achievement, Profile và Photo Booth.

## Luồng Chính

1. User mở tab Check-in.
2. FE xin quyền location bằng `expo-location`.
3. FE lấy `latitude`, `longitude`.
4. FE gọi BE lấy địa điểm check-in gần user.
5. User chọn địa điểm và bấm Check-in.
6. FE gọi verify location.
7. BE tự tính khoảng cách Haversine.
8. Nếu user trong 1km, BE lưu check-in.
9. Nếu địa điểm thuộc mission, BE cập nhật mission progress.
10. Nếu mission hoàn thành, BE grant reward.
11. Nếu reward là `checkin_frame`, FE refresh danh sách frame đã unlock.

## API: Lấy Địa Điểm Gần User

```http
GET /api/checkins/nearby?lat={latitude}&lng={longitude}&radius=1000
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "total": 1,
  "radiusMeters": 1000,
  "places": [
    {
      "placeId": "place_123",
      "name": "Landmark 81",
      "address": "TP.HCM",
      "location": {
        "lat": 10.795,
        "lng": 106.722
      },
      "images": ["https://..."],
      "distanceMeters": 230
    }
  ]
}
```

FE hiển thị theo `distanceMeters`. Không tự quyết định pass/fail bằng distance client.

## API: Verify Location Check-in

```http
POST /api/checkins/verify
Authorization: Bearer <access_token>
Content-Type: application/json
```

Payload:

```json
{
  "placeId": "place_123",
  "latitude": 10.795,
  "longitude": 106.722,
  "imageUri": "https://...",
  "title": "Check-in Landmark 81",
  "date": "15/06/2026"
}
```

`imageUri`, `title`, `date` là optional.

Response success:

```json
{
  "success": true,
  "checkin": {
    "_id": "checkin_123",
    "placeId": "place_123",
    "userLocation": {
      "latitude": 10.795,
      "longitude": 106.722
    },
    "distanceMeters": 230,
    "source": "location",
    "checkedInAt": "2026-06-15T..."
  },
  "place": {},
  "distanceMeters": 230,
  "missionProgress": [],
  "rewards": []
}
```

Nếu hoàn thành mission và nhận frame:

```json
{
  "success": true,
  "checkin": {},
  "place": {},
  "distanceMeters": 230,
  "missionProgress": [],
  "rewards": [
    {
      "type": "checkin_frame",
      "frameId": "frame_123",
      "granted": true
    }
  ]
}
```

## Error Codes Cần Handle

```ts
type CheckinErrorCode =
  | "invalid_coordinates"
  | "missing_place_id"
  | "invalid_place"
  | "invalid_place_location"
  | "outside_checkin_radius"
  | "already_checked_in"
  | "checkin_rate_limited"
  | "verify_checkin_failed";
```

Message gợi ý:

- `outside_checkin_radius`: Bạn đang ở ngoài bán kính check-in 1km.
- `already_checked_in`: Bạn đã check-in địa điểm này rồi.
- `invalid_coordinates`: Không lấy được tọa độ hợp lệ.
- `invalid_place`: Địa điểm không tồn tại hoặc chưa bật check-in.
- `checkin_rate_limited`: Bạn thử check-in quá nhiều lần. Vui lòng thử lại sau.

## API: Lấy Địa Điểm Đã Check-in Cho Profile

```http
GET /api/checkins/my/places
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "total": 1,
  "places": [
    {
      "checkin": {},
      "place": {},
      "distanceMeters": 230,
      "checkedInAt": "2026-06-15T..."
    }
  ]
}
```

Dùng cho section:

```txt
Địa điểm đã check-in
```

Nên tách component:

```txt
src/components/profile/CheckedInPlacesSection.tsx
```

## API: Lưu Photo Booth Memory

```http
POST /api/checkins
Authorization: Bearer <access_token>
Content-Type: application/json
```

Payload:

```json
{
  "imageUri": "https://...",
  "title": "Kỷ niệm Check-in",
  "date": "15/06/2026",
  "placeId": "place_123"
}
```

Quan trọng:

- Endpoint này chỉ lưu ảnh/kỷ niệm.
- Endpoint này không cập nhật mission.
- Muốn cập nhật mission phải dùng `POST /api/checkins/verify`.

## API: Missions

### Lấy mission đang active

```http
GET /api/missions
```

### Lấy progress mission của user

```http
GET /api/missions/my-progress
Authorization: Bearer <access_token>
```

Response item sẽ có:

```ts
{
  mission: {},
  progress: {},
  checkedPlaceIds: string[],
  requiredCount: number,
  checkedCount: number,
  isCompleted: boolean,
  rewardGranted: boolean,
  reward: object | null
}
```

### Claim reward thủ công

```http
POST /api/missions/:id/claim-reward
Authorization: Bearer <access_token>
```

Hiện BE đã tự grant reward khi verify location làm mission hoàn thành. FE chỉ cần dùng claim nếu muốn UX có nút "Nhận thưởng".

## API: Check-in Frames

```http
GET /api/frames/my-unlocked
Authorization: Bearer <access_token>
```

Response trả:

- Frame miễn phí: `unlockType = "free"`.
- Frame mission đã unlock: `unlockType = "mission"`.

Camera/photo booth nên dùng API này.

## Service Gợi Ý

### checkinService

```ts
export const getNearbyCheckinPlaces = async (
  latitude: number,
  longitude: number,
  radius = 1000
) => {
  const res = await api.get("/checkins/nearby", {
    params: { lat: latitude, lng: longitude, radius }
  });
  return res.data?.places ?? [];
};

export const verifyLocationCheckin = async (payload: {
  placeId: string;
  latitude: number;
  longitude: number;
  imageUri?: string;
  title?: string;
  date?: string;
}) => {
  const res = await api.post("/checkins/verify", payload);
  return res.data;
};

export const getMyCheckedInPlaces = async () => {
  const res = await api.get("/checkins/my/places");
  return res.data?.places ?? [];
};

export const createPhotoMemory = async (payload: {
  imageUri: string;
  title?: string;
  date?: string;
  placeId?: string;
}) => {
  const res = await api.post("/checkins", payload);
  return res.data;
};
```

### missionService

```ts
export const getMissions = async () => {
  const res = await api.get("/missions");
  return res.data?.missions ?? [];
};

export const getMyMissionProgress = async () => {
  const res = await api.get("/missions/my-progress");
  return res.data?.missions ?? [];
};

export const claimMissionReward = async (missionId: string) => {
  const res = await api.post(`/missions/${missionId}/claim-reward`);
  return res.data;
};
```

### frameService

```ts
export const getMyUnlockedFrames = async () => {
  const res = await api.get("/frames/my-unlocked");
  return res.data?.frames ?? [];
};
```

## UI Flow Gợi Ý

Tab Check-in nên có 3 mode:

```ts
type CheckinMode = "memories" | "nearby" | "missions";
```

- `memories`: gallery/photo booth memories.
- `nearby`: địa điểm gần user.
- `missions`: mission progress.

Khi user verify check-in thành công:

```ts
const result = await checkinService.verifyLocationCheckin({
  placeId,
  latitude,
  longitude
});

if (result.rewards?.some((reward) => reward.type === "checkin_frame")) {
  await frameService.getMyUnlockedFrames();
}

await missionService.getMyMissionProgress();
```

## Rule Quan Trọng

- User không check-in được địa điểm bất kỳ ngoài DB.
- `/checkins/nearby` chỉ trả địa điểm có trong DB và nằm trong bán kính.
- `/checkins/verify` bắt buộc `placeId` tồn tại trong DB.
- BE tự tính distance, FE không tự quyết định hợp lệ.
- Mission dùng `requiredPlaceIds`, không dùng `placeIds`.
- Reward frame dùng `checkin_frame`, không dùng `avatar_item`.
- Photo booth dùng `/checkins`, không dùng endpoint này để cộng mission.

## Checklist User FE

- [ ] Gắn `expo-location`.
- [ ] Xin quyền location khi vào Check-in tab.
- [ ] Gọi `/checkins/nearby`.
- [ ] Render địa điểm gần user.
- [ ] Gọi `/checkins/verify` khi user check-in.
- [ ] Handle error code.
- [ ] Refresh mission progress sau verify.
- [ ] Refresh frames nếu nhận `checkin_frame`.
- [ ] Thêm `CheckedInPlacesSection` trong Profile.
- [ ] Missions/Achievement dùng `/missions/my-progress`.
