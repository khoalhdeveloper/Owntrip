"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoGenerateTrip = exports.rearrangeItinerary = void 0;
const axios_1 = __importDefault(require("axios"));
const apiKey = process.env.GEMINI_API_KEY || '';
const rearrangeItinerary = async (req, res) => {
    try {
        const { userInput, currentPlaces } = req.body;
        if (!apiKey) {
            return res.status(500).json({ code: "500", message: "Thiếu GEMINI_API_KEY trong file .env của BE" });
        }
        const placesInfo = currentPlaces.map((p, index) => ({
            id: p.place._id,
            name: p.place.name,
            address: p.place.address,
            timeOfDay: p.place.timeOfDay,
            currentOrder: index + 1
        }));
        const prompt = `
      Tôi là một hệ thống tự động sắp xếp lịch trình du lịch.
      Danh sách địa điểm hiện tại (đang theo thứ tự):
      ${JSON.stringify(placesInfo, null, 2)}
      
      Người dùng yêu cầu: "${userInput}"
      
      Hãy phân tích yêu cầu và sắp xếp lại danh sách các địa điểm.
      Bạn BẮT BUỘC PHẢI trả về KẾT QUẢ DƯỚI DẠNG JSON hợp lệ. KHÔNG bọc bằng markdown (\`\`\`json).
      Cấu trúc JSON yêu cầu:
      {
        "orderedPlaceIds": ["id1", "id2", ...],
        "replyMessage": "Một câu trả lời ngắn gọn, thân thiện bằng tiếng Việt."
      }
    `;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
        try {
            const response = await axios_1.default.post(url, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            const data = response.data;
            const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) {
                return res.status(500).json({ message: "Không nhận được phản hồi từ AI" });
            }
            const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJsonStr);
            if (parsedData.orderedPlaceIds && Array.isArray(parsedData.orderedPlaceIds)) {
                return res.status(200).json(parsedData);
            }
            return res.status(500).json({ message: "Dữ liệu trả về từ AI không hợp lệ" });
        }
        catch (axiosError) {
            if (axiosError.code === 'ECONNABORTED') {
                return res.status(504).json({ message: "Gateway Timeout: Gọi Gemini AI quá lâu" });
            }
            throw axiosError;
        }
    }
    catch (error) {
        console.error("Lỗi BE AI Rearrange:", error?.response?.data || error?.message || error);
        return res.status(500).json({ code: "500", message: "A server error has occurred" });
    }
};
exports.rearrangeItinerary = rearrangeItinerary;
const autoGenerateTrip = async (req, res) => {
    try {
        const { days, availablePlaces } = req.body;
        if (!apiKey) {
            return res.status(500).json({ code: "500", message: "Thiếu GEMINI_API_KEY trong file .env của BE" });
        }
        const dayList = days.map((d) => ({
            dayId: d.dayId,
            day: d.day,
        }));
        const placesInfo = availablePlaces.map((p) => ({
            id: p.placeId || p._id,
            name: p.name,
            types: p.types || p.category,
            rating: p.rating,
        }));
        const prompt = `
      Tôi đang lên lịch trình cho một chuyến đi ${days.length} ngày.
      Đây là danh sách các ngày:
      ${JSON.stringify(dayList, null, 2)}
      
      Đây là danh sách các địa điểm có sẵn tại điểm đến:
      ${JSON.stringify(placesInfo, null, 2)}
      
      Hãy chọn ngẫu nhiên khoảng 3-4 địa điểm cho mỗi ngày (cố gắng chọn đa dạng các loại hình như ăn uống, tham quan, giải trí).
      Tuyệt đối không chọn trùng lặp 1 địa điểm cho nhiều ngày khác nhau.
      Bạn BẮT BUỘC PHẢI trả về kết quả dưới định dạng JSON hợp lệ (KHÔNG bọc bằng markdown \`\`\`json).
      
      Cấu trúc JSON yêu cầu:
      {
        "itinerary": [
          {
            "dayId": "ID_CỦA_NGÀY",
            "placeIds": ["ID_ĐỊA_ĐIỂM_1", "ID_ĐỊA_ĐIỂM_2", "ID_ĐỊA_ĐIỂM_3"]
          }
        ],
        "replyMessage": "Một câu giới thiệu ngắn gọn, thân thiện (ví dụ: 'Dạ em đã chọn lọc và lên lịch trình hoàn chỉnh cho anh/chị rồi ạ!')"
      }
    `;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
        try {
            const response = await axios_1.default.post(url, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4 }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            const data = response.data;
            const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) {
                return res.status(500).json({ message: "Không nhận được phản hồi từ AI" });
            }
            const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJsonStr);
            if (parsedData.itinerary && Array.isArray(parsedData.itinerary)) {
                return res.status(200).json(parsedData);
            }
            return res.status(500).json({ message: "Dữ liệu trả về từ AI không hợp lệ" });
        }
        catch (axiosError) {
            if (axiosError.code === 'ECONNABORTED') {
                return res.status(504).json({ message: "Gateway Timeout: Gọi Gemini AI quá lâu" });
            }
            throw axiosError;
        }
    }
    catch (error) {
        console.error("Lỗi BE Auto Generate AI:", error?.response?.data || error?.message || error);
        return res.status(500).json({ code: "500", message: "A server error has occurred" });
    }
};
exports.autoGenerateTrip = autoGenerateTrip;
