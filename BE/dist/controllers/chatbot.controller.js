"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatBot = void 0;
const gemini_service_1 = require("../services/gemini.service");
const chatBot = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }
        const reply = await (0, gemini_service_1.askTravelBot)(message);
        res.json({
            success: true,
            reply
        });
    }
    catch (error) {
        const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 500;
        const responseMessage = statusCode >= 500
            ? "Chat service is temporarily unavailable. Please try again shortly."
            : error?.message || "Unexpected error";
        res.status(statusCode).json({
            success: false,
            message: responseMessage
        });
    }
};
exports.chatBot = chatBot;
