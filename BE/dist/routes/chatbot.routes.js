"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbot_controller_1 = require("../controllers/chatbot.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const aiRateLimit_middleware_1 = require("../middlewares/aiRateLimit.middleware");
const router = (0, express_1.Router)();
router.post("/chat", auth_middleware_1.verifyToken, aiRateLimit_middleware_1.aiRateLimit, chatbot_controller_1.chatBot);
module.exports = router;
