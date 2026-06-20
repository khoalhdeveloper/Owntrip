"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const aiRateLimit_middleware_1 = require("../middlewares/aiRateLimit.middleware");
const router = express_1.default.Router();
router.post('/rearrange', auth_middleware_1.verifyToken, aiRateLimit_middleware_1.aiRateLimit, ai_controller_1.rearrangeItinerary);
router.post('/auto-generate', auth_middleware_1.verifyToken, aiRateLimit_middleware_1.aiRateLimit, ai_controller_1.autoGenerateTrip);
router.post('/itinerary-score', auth_middleware_1.verifyToken, aiRateLimit_middleware_1.aiRateLimit, ai_controller_1.scoreItinerary);
module.exports = router;
