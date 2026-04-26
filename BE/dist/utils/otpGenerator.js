"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOTPExpiration = exports.generateOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[crypto_1.default.randomInt(0, digits.length)];
    }
    return otp;
};
exports.generateOTP = generateOTP;
const getOTPExpiration = (minutes = 5) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};
exports.getOTPExpiration = getOTPExpiration;
