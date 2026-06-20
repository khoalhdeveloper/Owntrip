"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatBot = void 0;
const gemini_service_1 = require("../services/gemini.service");
const chatBot = async (req, res) => {
    try {
        const { message, tripContext } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập nội dung tin nhắn"
            });
        }
        const reply = await (0, gemini_service_1.askTravelBot)(message, tripContext);
        res.json({
            success: true,
            reply
        });
    }
    catch (error) {
        const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 500;
        const responseMessage = statusCode >= 500
            ? "Dịch vụ chat tạm thời không khả dụng. Vui lòng thử lại sau."
            : error?.message || "Đã xảy ra lỗi không mong muốn";
        res.status(statusCode).json({
            success: false,
            message: responseMessage
        });
    }
};
exports.chatBot = chatBot;
