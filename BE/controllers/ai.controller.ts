import { Response } from "express";
import axios from "axios";
import PlanDay from "../models/planDay.model";
import PlanPlace from "../models/planPlace.model";
import Trip from "../models/trip.model";
import { AuthRequest } from "../middlewares/auth.middleware";

const apiKey = process.env.GEMINI_API_KEY || "";
const geminiUrl = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

type PlaceInfo = {
  id: string;
  alternateIds: string[];
  name: string;
  address?: string;
  timeOfDay?: string;
  currentOrder: number;
};

const cleanGeminiJson = (responseText: string) =>
  responseText.replace(/```json/g, "").replace(/```/g, "").trim();

const callGeminiJson = async (prompt: string, temperature: number) => {
  const response = await axios.post(
    geminiUrl(),
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature }
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    }
  );

  const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error("No AI response text");
  }

  return JSON.parse(cleanGeminiJson(responseText));
};

const assertDayOwner = async (dayId: string, userId: string) => {
  const day = await PlanDay.findById(dayId);
  if (!day) {
    return false;
  }

  const trip = await Trip.findOne({ _id: day.tripId, userId });
  return Boolean(trip);
};

const assertAllDaysOwner = async (dayIds: string[], userId: string) => {
  if (dayIds.length === 0) {
    return true;
  }

  const days = await PlanDay.find({ _id: { $in: dayIds } });
  if (days.length !== dayIds.length) {
    return false;
  }

  const tripIds = Array.from(new Set(days.map((day) => String(day.tripId))));
  const ownedTrips = await Trip.countDocuments({ _id: { $in: tripIds }, userId });
  return ownedTrips === tripIds.length;
};

const buildPlaceInfoFromBody = (currentPlaces: any[]): PlaceInfo[] => {
  return currentPlaces.map((item: any, index: number) => {
    const place = item.place || item;
    const id = String(place._id || item._id || item.planPlaceId || place.placeId || item.placeId);

    return {
      id,
      alternateIds: [id, place.placeId, item.placeId, item.planPlaceId, item._id]
        .filter(Boolean)
        .map((value) => String(value)),
      name: String(place.name || item.name || "Địa điểm chưa rõ"),
      address: place.address || item.address,
      timeOfDay: place.timeOfDay || item.timeOfDay,
      currentOrder: index + 1
    };
  });
};

const loadPlaceInfoForDay = async (dayId: string): Promise<PlaceInfo[]> => {
  const places = await PlanPlace.find({ dayId }).sort({ order: 1, createdAt: 1 });

  return places.map((place: any, index) => ({
    id: String(place._id),
    alternateIds: [String(place._id), place.placeId].filter(Boolean).map((value) => String(value)),
    name: String(place.name || "Địa điểm chưa rõ"),
    address: place.address,
    timeOfDay: place.timeOfDay,
    currentOrder: typeof place.order === "number" ? place.order : index + 1
  }));
};

const validateOrderedPlaceIds = (orderedPlaceIds: string[], placesInfo: PlaceInfo[]) => {
  const normalizedIds = orderedPlaceIds.map((id) => String(id));
  const uniqueIds = new Set(normalizedIds);

  if (uniqueIds.size !== normalizedIds.length) {
    return "orderedPlaceIds có giá trị bị trùng";
  }

  const validIds = new Set(placesInfo.flatMap((place) => place.alternateIds));
  const missingIds = normalizedIds.filter((id) => !validIds.has(id));
  if (missingIds.length > 0) {
    return `orderedPlaceIds có địa điểm không thuộc lịch trình này: ${missingIds.join(", ")}`;
  }

  if (normalizedIds.length !== placesInfo.length) {
    return "orderedPlaceIds phải chứa đầy đủ các địa điểm trong ngày";
  }

  return null;
};

const buildFallbackChanges = (orderedPlaceIds: string[], placesInfo: PlaceInfo[]) => {
  const placeByAnyId = new Map<string, PlaceInfo>();
  for (const place of placesInfo) {
    for (const id of place.alternateIds) {
      placeByAnyId.set(id, place);
    }
  }

  return orderedPlaceIds
    .map((placeId, index) => {
      const place = placeByAnyId.get(String(placeId));
      if (!place || place.currentOrder === index + 1) {
        return null;
      }

      return {
        placeId: String(placeId),
        placeName: place.name,
        fromOrder: place.currentOrder,
        toOrder: index + 1,
        reason: "AI đề xuất thứ tự này dựa trên yêu cầu của bạn."
      };
    })
    .filter(Boolean);
};

export const rearrangeItinerary = async (req: AuthRequest, res: Response) => {
  try {
    const { userInput, currentPlaces, dayId } = req.body;
    const userId = req.user?.userId;

    if (!apiKey) {
      return res.status(500).json({ code: "500", message: "Thiếu GEMINI_API_KEY" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (dayId && !(await assertDayOwner(String(dayId), userId))) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa lịch trình này"
      });
    }

    const placesInfo = dayId
      ? await loadPlaceInfoForDay(String(dayId))
      : buildPlaceInfoFromBody(Array.isArray(currentPlaces) ? currentPlaces : []);

    if (placesInfo.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cần truyền currentPlaces hoặc dayId có địa điểm"
      });
    }

    const prompt = `
Bạn là trợ lý sắp xếp lịch trình du lịch. Backend chỉ tạo bản xem trước gợi ý của bạn và không tự áp dụng thay đổi.

Danh sách địa điểm hiện tại theo thứ tự:
${JSON.stringify(placesInfo, null, 2)}

Yêu cầu của người dùng: "${userInput || "Tối ưu lịch trình này"}"

Chỉ trả về JSON hợp lệ, không dùng markdown:
{
  "orderedPlaceIds": [],
  "replyMessage": "",
  "summary": "",
  "changes": [
    {
      "placeId": "",
      "placeName": "",
      "fromOrder": 1,
      "toOrder": 2,
      "reason": ""
    }
  ]
}

Quy tắc:
- orderedPlaceIds phải chứa mỗi địa điểm hiện tại đúng một lần.
- Dùng đúng các giá trị id địa điểm trong dữ liệu đầu vào.
- replyMessage, summary và reason phải viết bằng tiếng Việt có dấu, tự nhiên, thân thiện.
`;

    const parsedData = await callGeminiJson(prompt, 0.2);
    const orderedPlaceIds = Array.isArray(parsedData.orderedPlaceIds)
      ? parsedData.orderedPlaceIds.map((id: any) => String(id))
      : [];

    const validationError = validateOrderedPlaceIds(orderedPlaceIds, placesInfo);
    if (validationError) {
      return res.status(502).json({
        success: false,
        message: "AI trả về dữ liệu lịch trình không hợp lệ",
        details: validationError
      });
    }

    return res.status(200).json({
      orderedPlaceIds,
      replyMessage: parsedData.replyMessage || "Đã tạo bản xem trước sắp xếp lịch trình.",
      summary: parsedData.summary || "AI đã đề xuất thứ tự mới cho lịch trình.",
      changes: Array.isArray(parsedData.changes) && parsedData.changes.length > 0
        ? parsedData.changes
        : buildFallbackChanges(orderedPlaceIds, placesInfo)
    });
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ message: "Gemini AI phản hồi quá lâu" });
    }

    console.error("AI rearrange error:", error?.response?.data || error?.message || error);
    return res.status(500).json({ code: "500", message: "Đã xảy ra lỗi máy chủ" });
  }
};

export const autoGenerateTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { days, availablePlaces } = req.body;
    const userId = req.user?.userId;

    if (!apiKey) {
      return res.status(500).json({ code: "500", message: "Thiếu GEMINI_API_KEY" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (!Array.isArray(days) || !Array.isArray(availablePlaces)) {
      return res.status(400).json({
        success: false,
        message: "days và availablePlaces phải là mảng"
      });
    }

    const dayIds = days.map((day: any) => day.dayId).filter(Boolean).map((dayId: any) => String(dayId));
    if (!(await assertAllDaysOwner(dayIds, userId))) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa lịch trình này"
      });
    }

    const dayList = days.map((day: any) => ({
      dayId: day.dayId,
      day: day.day
    }));

    const placesInfo = availablePlaces.map((place: any) => ({
      id: place.placeId || place._id,
      name: place.name,
      types: place.types || place.category,
      rating: place.rating
    }));

    const prompt = `
Hãy tạo lịch trình du lịch trong ${days.length} ngày.

Danh sách ngày:
${JSON.stringify(dayList, null, 2)}

Danh sách địa điểm có thể chọn:
${JSON.stringify(placesInfo, null, 2)}

Chọn khoảng 3-4 địa điểm mỗi ngày, ưu tiên đa dạng trải nghiệm và không chọn trùng một địa điểm ở nhiều ngày.
Chỉ trả về JSON hợp lệ, không dùng markdown:
{
  "itinerary": [
    {
      "dayId": "",
      "placeIds": []
    }
  ],
  "replyMessage": ""
}

replyMessage phải viết bằng tiếng Việt có dấu, tự nhiên, thân thiện.
`;

    const parsedData = await callGeminiJson(prompt, 0.4);

    if (parsedData.itinerary && Array.isArray(parsedData.itinerary)) {
      return res.status(200).json(parsedData);
    }

    return res.status(502).json({ message: "AI trả về dữ liệu lịch trình không hợp lệ" });
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ message: "Gemini AI phản hồi quá lâu" });
    }

    console.error("AI auto generate error:", error?.response?.data || error?.message || error);
    return res.status(500).json({ code: "500", message: "Đã xảy ra lỗi máy chủ" });
  }
};

export const scoreItinerary = async (req: AuthRequest, res: Response) => {
  try {
    const { trip, days } = req.body;

    if (!apiKey) {
      return res.status(500).json({ code: "500", message: "Thiếu GEMINI_API_KEY" });
    }

    if (!trip || !Array.isArray(days)) {
      return res.status(400).json({
        success: false,
        message: "Cần truyền trip và days"
      });
    }

    const prompt = `
Hãy chấm điểm lịch trình du lịch này theo thang điểm từ 0 đến 100.

Trip:
${JSON.stringify(trip, null, 2)}

Các ngày:
${JSON.stringify(days, null, 2)}

Chỉ trả về JSON hợp lệ, không dùng markdown:
{
  "score": 85,
  "level": "good",
  "summary": "",
  "warnings": [],
  "suggestions": [],
  "dayReviews": [
    {
      "day": 1,
      "score": 80,
      "warnings": [],
      "suggestions": []
    }
  ]
}

Quy tắc:
- level phải là một trong các giá trị "good", "warning", "too_busy".
- summary, warnings, suggestions và dayReviews phải viết bằng tiếng Việt có dấu, rõ ràng, hữu ích cho UI.
`;

    const parsedData = await callGeminiJson(prompt, 0.3);
    const level = ["good", "warning", "too_busy"].includes(parsedData.level)
      ? parsedData.level
      : "warning";

    return res.status(200).json({
      score: Number(parsedData.score) || 0,
      level,
      summary: parsedData.summary || "",
      warnings: Array.isArray(parsedData.warnings) ? parsedData.warnings : [],
      suggestions: Array.isArray(parsedData.suggestions) ? parsedData.suggestions : [],
      dayReviews: Array.isArray(parsedData.dayReviews) ? parsedData.dayReviews : []
    });
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ message: "Gemini AI phản hồi quá lâu" });
    }

    console.error("AI score error:", error?.response?.data || error?.message || error);
    return res.status(500).json({ code: "500", message: "Đã xảy ra lỗi máy chủ" });
  }
};
