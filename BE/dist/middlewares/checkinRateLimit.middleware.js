"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkinVerifyRateLimit = void 0;
const attemptBuckets = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const checkinVerifyRateLimit = (req, res, next) => {
    const key = req.user?.userId || req.ip || "anonymous";
    const currentTime = Date.now();
    const recentAttempts = (attemptBuckets.get(key) || []).filter((timestamp) => currentTime - timestamp < WINDOW_MS);
    if (recentAttempts.length >= MAX_ATTEMPTS) {
        attemptBuckets.set(key, recentAttempts);
        return res.status(429).json({
            success: false,
            code: "checkin_rate_limited",
            message: "Too many check-in attempts. Please try again later."
        });
    }
    recentAttempts.push(currentTime);
    attemptBuckets.set(key, recentAttempts);
    next();
};
exports.checkinVerifyRateLimit = checkinVerifyRateLimit;
