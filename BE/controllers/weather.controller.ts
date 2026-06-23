import { Request, Response } from "express";
import axios from "axios";
import { normalizeText } from "../utils/provinceImages";

export const getWeatherForecast = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City parameter is required",
      });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "OpenWeather API key is not configured",
      });
    }

    // Lấy tên thành phố không dấu và loại bỏ các tiền tố hành chính (tp, tỉnh,...) để OpenWeather dễ tìm ra
    const searchCity = normalizeText(city as string)
      .replace(/^(tp|thanh pho|tinh|quan|huyen|tx|thi xa|tt|thi tran)\s+/i, '')
      .trim();

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(searchCity)}&appid=${apiKey}&units=metric&lang=vi`
    );

    // OpenWeatherMap trả về dự báo mỗi 3 giờ (list có 40 items cho 5 ngày)
    // Chúng ta sẽ lọc ra mỗi ngày 1 dự báo (thường ưu tiên lấy giờ giữa trưa, vd: 12:00:00)
    // Và giới hạn lấy 3 ngày theo yêu cầu.
    const list = response.data.list;
    const dailyForecasts: any[] = [];
    const seenDates = new Set();

    for (const item of list) {
      const datePart = item.dt_txt.split(" ")[0]; // "YYYY-MM-DD"
      const timePart = item.dt_txt.split(" ")[1]; // "HH:mm:ss"

      // Nếu chưa có dự báo cho ngày này, hoặc đã có ngày này nhưng timePart là "12:00:00" thì ưu tiên đè lên
      if (!seenDates.has(datePart)) {
        dailyForecasts.push(item);
        seenDates.add(datePart);
      } else if (timePart === "12:00:00") {
        // Cập nhật lại item cho ngày này với dự báo lúc 12h
        const index = dailyForecasts.findIndex((i) => i.dt_txt.startsWith(datePart));
        if (index !== -1) {
          dailyForecasts[index] = item;
        }
      }

      if (dailyForecasts.length >= 3 && seenDates.size >= 3) {
        // Chúng ta có thể có 4 items do ngày đầu có thể bị dư, nhưng slice phía dưới sẽ giải quyết
      }
    }


    const final3Days = dailyForecasts.slice(0, 4);

    return res.json({
      success: true,
      city: response.data.city.name,
      searchQuery: searchCity,
      forecast: final3Days,
    });
  } catch (error: any) {
    console.error("Get weather forecast error:", error?.response?.data || error?.message);

    // Nếu OpenWeather không tìm thấy thành phố (404)
    if (error?.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "City not found on OpenWeatherMap",
        searchQuery: normalizeText(req.query.city as string)
      });
    }

    return res.status(500).json({
      success: false,
      message: "Get weather forecast failed",
    });
  }
};
