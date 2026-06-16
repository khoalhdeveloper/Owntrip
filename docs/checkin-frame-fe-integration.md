# FE Integration Guide: Location Check-in, Missions, Check-in Frames

Tài liệu này là bản FE cần bám theo BE hiện tại cho luồng:

- User mở tab Check-in.
- FE xin quyền GPS và lấy tọa độ.
- FE gọi BE lấy địa điểm có thể check-in trong bán kính 1km.
- User verify location check-in.
- BE tự tính khoảng cách, lưu check-in, cập nhật mission progress, grant reward.
- Nếu reward là `checkin_frame`, FE refresh frame list để user dùng frame mới trong camera/photo booth.

## Endpoints Đang Có

### 1. Lấy địa điểm check-in gần user

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
      "isCheckinEnabled": true,
      "distanceMeters": 230
    }
  ]
}
```

FE dùng `distanceMeters` do BE trả về. Không tự quyết định hợp lệ bằng distance client.

### 2. Verify location check-in

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

`imageUri`, `title`, `date` là optional. Với check-in location không cần ảnh vẫn verify được.

Response success:

```json
{
  "success": true,
  "checkin": {
    "_id": "checkin_123",
    "userId": "user_123",
    "placeId": "place_123",
    "imageUri": "",
    "title": "Landmark 81",
    "date": "15/06/2026",
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

Response nếu hoàn thành mission và nhận frame:

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

Error codes FE nên handle:

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

Gợi ý message:

- `outside_checkin_radius`: Bạn đang ở ngoài bán kính check-in 1km.
- `already_checked_in`: Bạn đã check-in địa điểm này rồi.
- `invalid_coordinates`: Không lấy được tọa độ hợp lệ.
- `invalid_place`: Địa điểm không tồn tại hoặc chưa bật check-in.
- `checkin_rate_limited`: Bạn thử check-in quá nhiều lần, vui lòng thử lại sau.

### 3. Lấy lịch sử check-in/kỷ niệm

```http
GET /api/checkins/my
Authorization: Bearer <access_token>
```

API này trả tất cả check-in, gồm:

- `source = "photo_booth"`
- `source = "location"`

### 4. Lấy địa điểm đã check-in cho Profile

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

API này dùng cho section Profile: "Địa điểm đã check-in".

### 5. Lưu ảnh/kỷ niệm photo booth

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

Lưu ý quan trọng:

- Endpoint này chỉ lưu photo memory.
- Endpoint này không cộng mission progress.
- Muốn cộng mission, FE phải gọi `POST /api/checkins/verify`.

### 6. Lấy missions

```http
GET /api/missions
```

Response có các mission đang active.

Mission dùng field:

```ts
requiredPlaceIds: string[];
```

### 7. Lấy progress mission của user

```http
GET /api/missions/my-progress
Authorization: Bearer <access_token>
```

Dùng cho màn hình Missions/Achievement.

### 8. Claim reward thủ công

```http
POST /api/missions/:id/claim-reward
Authorization: Bearer <access_token>
```

Hiện BE có thể grant reward tự động khi verify location check-in hoàn thành mission. Endpoint claim để dành nếu FE muốn nút "Nhận thưởng".

### 9. Admin quản lý mission

Các API này cần token admin.

```http
GET /api/missions/admin
Authorization: Bearer <admin_access_token>
```

```http
POST /api/missions
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Payload tạo mission check-in frame:

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

Payload tạo mission điểm:

```json
{
  "title": "Check-in trung tâm thành phố",
  "requiredPlaceIds": ["place_1"],
  "reward": {
    "type": "points",
    "pointsAmount": 100
  },
  "isActive": true
}
```

Các endpoint khác:

```http
PUT /api/missions/:id
PATCH /api/missions/:id/toggle
DELETE /api/missions/:id
```

Validation BE đang có:

- `title` bắt buộc khi tạo.
- `requiredPlaceIds` phải có ít nhất một place.
- `reward.type` chỉ nhận `points`, `souvenir`, `checkin_frame`.
- `checkin_frame` bắt buộc có `frameId`.
- `points` bắt buộc có `pointsAmount > 0`.
- `souvenir` bắt buộc có `souvenirId`.

### 10. Lấy frame user đã unlock

```http
GET /api/frames/my-unlocked
Authorization: Bearer <access_token>
```

Response trả:

- Frame miễn phí: `unlockType = "free"`.
- Frame mission đã unlock: `unlockType = "mission"` và user đã nhận reward.

Camera/photo booth nên dùng API này, không dùng `/api/frames` nếu muốn khóa frame mission.

## FE Service Gợi Ý

Tạo hoặc mở rộng:

```txt
src/services/checkinService.ts
src/services/missionService.ts
src/services/frameService.ts
```

### checkinService

```ts
import api from "@/src/lib/api";

export type CheckinSource = "location" | "photo_booth";

export interface NearbyCheckinPlace {
  placeId: string;
  name: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  images?: string[];
  distanceMeters: number;
  isCheckinEnabled?: boolean;
}

export interface VerifyLocationCheckinPayload {
  placeId: string;
  latitude: number;
  longitude: number;
  imageUri?: string;
  title?: string;
  date?: string;
}

export const getNearbyCheckinPlaces = async (
  latitude: number,
  longitude: number,
  radius = 1000
): Promise<NearbyCheckinPlace[]> => {
  const res = await api.get("/checkins/nearby", {
    params: {
      lat: latitude,
      lng: longitude,
      radius
    }
  });

  return res.data?.places ?? [];
};

export const verifyLocationCheckin = async (
  payload: VerifyLocationCheckinPayload
) => {
  const res = await api.post("/checkins/verify", payload);
  return res.data;
};

export const getMyCheckedInPlaces = async () => {
  const res = await api.get("/checkins/my/places");
  return res.data?.places ?? [];
};

export const getMyCheckins = async () => {
  const res = await api.get("/checkins/my");
  return res.data?.checkins ?? [];
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
import api from "@/src/lib/api";

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
import api from "@/src/lib/api";

export interface CheckinFrame {
  _id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  unlockType: "free" | "mission";
  layoutType: "single" | "filmstrip-4";
  slotsCount: number;
  isUnlocked: boolean;
}

export const getMyUnlockedFrames = async (): Promise<CheckinFrame[]> => {
  const res = await api.get("/frames/my-unlocked");
  return res.data?.frames ?? [];
};
```

## Check-in Tab Flow

File hiện tại:

```txt
src/app/(tabs)/checkin/index.tsx
```

Đang render `CheckinGalleryScreen`.

Gợi ý tách mode trong `CheckinGalleryScreen`:

```ts
type CheckinMode = "memories" | "nearby" | "missions";
```

UI tabs:

- `Kỷ niệm`: ảnh/photo booth cũ.
- `Địa điểm gần đây`: danh sách địa điểm trong 1km.
- `Nhiệm vụ`: progress mission.

### Khi mở tab Check-in

1. Xin quyền location bằng `expo-location`.
2. Nếu user từ chối, show empty/error state.
3. Nếu có tọa độ, gọi:

```ts
const places = await checkinService.getNearbyCheckinPlaces(
  coords.latitude,
  coords.longitude
);
```

4. Render danh sách places theo `distanceMeters`.

### Khi user bấm check-in địa điểm

```ts
try {
  const result = await checkinService.verifyLocationCheckin({
    placeId: selectedPlace.placeId,
    latitude: coords.latitude,
    longitude: coords.longitude
  });

  showSuccess({
    placeName: result.place?.name,
    distanceMeters: result.distanceMeters
  });

  if (result.rewards?.some((reward) => reward.type === "checkin_frame")) {
    await frameService.getMyUnlockedFrames();
    showRewardModal(result.rewards);
  }

  await refreshNearbyPlaces();
  await refreshMissionProgress();
} catch (error) {
  handleCheckinError(error);
}
```

## Error Handling FE

```ts
const getCheckinErrorMessage = (code?: string) => {
  switch (code) {
    case "outside_checkin_radius":
      return "Bạn đang ở ngoài bán kính check-in 1km.";
    case "already_checked_in":
      return "Bạn đã check-in địa điểm này rồi.";
    case "invalid_coordinates":
      return "Không lấy được tọa độ hợp lệ.";
    case "invalid_place":
      return "Địa điểm không tồn tại hoặc chưa bật check-in.";
    case "checkin_rate_limited":
      return "Bạn thử check-in quá nhiều lần. Vui lòng thử lại sau.";
    default:
      return "Không thể check-in lúc này.";
  }
};
```

## Profile Flow

File hiện có:

```txt
src/app/(tabs)/profile.tsx
```

Nên tách component:

```txt
src/components/profile/CheckedInPlacesSection.tsx
```

Component này gọi:

```ts
const places = await checkinService.getMyCheckedInPlaces();
```

Hiển thị:

- Tên địa điểm.
- Ảnh địa điểm nếu có.
- Ngày check-in.
- Khoảng cách lúc check-in.

## Missions / Achievement Flow

Files hiện có:

```txt
src/app/missions.tsx
src/app/achievement.tsx
src/services/souvenirsService.ts
```

Nên thêm `missionService.ts` riêng, không nhét vào `souvenirsService`.

`missions.tsx` hiển thị:

- Mission title.
- Description.
- Required places.
- Progress: `checkedCount / requiredCount`.
- Reward.
- Status: chưa hoàn thành, đã hoàn thành, đã nhận thưởng.

`achievement.tsx` có thể dùng cùng API `getMyMissionProgress()`.

## Check-in Frame Flow

Khi user mở camera/photo booth:

```ts
const frames = await frameService.getMyUnlockedFrames();
```

Render frame picker từ danh sách này.

Khi verify location trả reward:

```ts
const hasNewFrame = result.rewards?.some(
  (reward) => reward.type === "checkin_frame" && reward.granted
);

if (hasNewFrame) {
  await frameService.getMyUnlockedFrames();
}
```

## Rule Quan Trọng

- `POST /api/checkins/verify` là luồng location thật, có tính distance và cập nhật mission.
- `POST /api/checkins` chỉ lưu ảnh/kỷ niệm, không cập nhật mission.
- FE không được tự tính distance để quyết định pass/fail.
- Mission dùng field `requiredPlaceIds`, không dùng `placeIds`.
- Reward frame dùng type `checkin_frame`, không dùng `avatar_item`.
- Camera/photo booth dùng `/api/frames/my-unlocked`.

## FE Checklist

- [ ] Cài/gắn `expo-location` trong Check-in tab.
- [ ] Gọi `/checkins/nearby` sau khi lấy GPS.
- [ ] Render nearby places với `distanceMeters`.
- [ ] Gọi `/checkins/verify` khi user check-in địa điểm.
- [ ] Handle error code từ BE.
- [ ] Refresh mission progress sau khi verify thành công.
- [ ] Refresh unlocked frames nếu reward có `checkin_frame`.
- [ ] Thêm `CheckedInPlacesSection` trong Profile.
- [ ] Missions/Achievement dùng `/missions/my-progress`.
- [ ] Photo booth tiếp tục dùng `/checkins` để lưu ảnh, không dùng endpoint này để cộng mission.
