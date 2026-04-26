import { Request, Response } from "express";
import { askTravelBot } from "../services/gemini.service";

export const chatBot = async (req: Request, res: Response) => {

  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const reply = await askTravelBot(message);

    res.json({
      success: true,
      reply
    });

  } catch (error: any) {

    const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 500;
    const responseMessage =
      statusCode >= 500
        ? "Chat service is temporarily unavailable. Please try again shortly."
        : error?.message || "Unexpected error";

    res.status(statusCode).json({
      success: false,
      message: responseMessage
    });

  }

};