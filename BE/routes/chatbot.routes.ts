import { Router } from "express";
import { chatBot } from "../controllers/chatbot.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { aiRateLimit } from "../middlewares/aiRateLimit.middleware";

const router = Router();

router.post("/chat", verifyToken, aiRateLimit, chatBot);

module.exports = router;
