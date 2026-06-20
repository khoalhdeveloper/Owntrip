"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRateLimit = void 0;
const requestBuckets = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 15);
const aiRateLimit = (req, res, next) => {
    const key = req.user?.userId || req.ip || "anonymous";
    const now = Date.now();
    const recentRequests = (requestBuckets.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
    if (recentRequests.length >= MAX_REQUESTS) {
        requestBuckets.set(key, recentRequests);
        return res.status(429).json({
            success: false,
            code: "ai_rate_limited",
            message: "Bạn đang gửi quá nhiều yêu cầu AI. Vui lòng thử lại sau một phút."
        });
    }
    recentRequests.push(now);
    requestBuckets.set(key, recentRequests);
    next();
};
exports.aiRateLimit = aiRateLimit;
