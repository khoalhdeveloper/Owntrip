"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emailService_1 = require("./emailService");
const path_1 = __importDefault(require("path"));
require('dotenv').config({ path: path_1.default.resolve(__dirname, '../.env') });
async function test() {
    console.log("Loaded EMAIL_USER:", process.env.EMAIL_USER);
    console.log("Loaded EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
    try {
        const success = await (0, emailService_1.sendEmailTemplate)('9a5vominhchanh@gmail.com', 'Xác thực tài khoản của bạn', 'otpTemplate', {
            DISPLAY_NAME: 'Test User',
            OTP_CODE: '654321'
        });
        console.log("sendEmailTemplate returned:", success);
    }
    catch (err) {
        console.error("Test error:", err);
    }
    process.exit(0);
}
test();
