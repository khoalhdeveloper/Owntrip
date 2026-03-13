import { Router } from "express";
import { chatBot } from "../controllers/chatbot.controller";

const router = Router();

router.post("/chat", chatBot);

module.exports = router;