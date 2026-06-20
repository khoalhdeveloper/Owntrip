import { Request, Response } from "express";
import { askTravelBot } from "../services/gemini.service";

export const chatBot = async (req: Request, res: Response) => {

  try {

    const { message, tripContext } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập nội dung tin nhắn"
      });
    }

    const reply = await askTravelBot(message, tripContext);

    res.json({
      success: true,
      reply
    });

  } catch (error: any) {

    const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 500;
    const responseMessage =
      statusCode >= 500
        ? "Dịch vụ chat tạm thời không khả dụng. Vui lòng thử lại sau."
        : error?.message || "Đã xảy ra lỗi không mong muốn";

    res.status(statusCode).json({
      success: false,
      message: responseMessage
    });

  }

};
