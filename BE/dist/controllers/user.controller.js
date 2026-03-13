"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otpGenerator_1 = require("../utils/otpGenerator");
const emailService_1 = require("../utils/emailService");
const google_auth_library_1 = require("google-auth-library");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.UserController = {
    register: async (req, res) => {
        try {
            const otp = (0, otpGenerator_1.generateOTP)();
            const otpExpires = (0, otpGenerator_1.getOTPExpiration)();
            const user = new user_model_1.default({
                ...req.body,
                otp,
                otpExpires,
                isVerified: false
            });
            await user.save();
            await (0, emailService_1.sendEmailTemplate)(user.email, 'Xác thực tài khoản của bạn', 'otpTemplate', {
                DISPLAY_NAME: user.displayName,
                OTP_CODE: otp
            });
            res.status(201).json({
                success: true,
                message: "User registered successfully. Please verify your email with the OTP sent.",
                otp
            });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    verifyEmail: async (req, res) => {
        try {
            const { email, otp } = req.body;
            const user = await user_model_1.default.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: false, message: "Invalid email or OTP" });
            }
            if (user.isVerified) {
                return res.status(400).json({ success: false, message: "Email is already verified" });
            }
            if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
                return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
            }
            user.isVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            res.json({ success: true, message: "Email verified successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    resendOTP: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await user_model_1.default.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: false, message: "User not found" });
            }
            const otp = (0, otpGenerator_1.generateOTP)();
            const otpExpires = (0, otpGenerator_1.getOTPExpiration)();
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
            await (0, emailService_1.sendEmailTemplate)(user.email, 'Xác thực tài khoản của bạn', 'otpTemplate', {
                DISPLAY_NAME: user.displayName,
                OTP_CODE: otp
            });
            res.json({ success: true, message: "OTP resent successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getProfile: async (req, res) => {
        try {
            const user = await user_model_1.default.findOne({ userId: req.params.id }).select('-password');
            if (!user)
                return res.status(404).json({ message: "User not found" });
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await user_model_1.default.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: false, message: "Invalid email or password" });
            }
            const isMatch = await bcrypt_1.default.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Invalid email or password" });
            }
            if (!user.isVerified) {
                return res.status(403).json({ success: false, message: "Please verify your email first" });
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.userId, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({
                success: true,
                message: "Login successful",
                token,
                userId: user.userId,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    googleLogin: async (req, res) => {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ success: false, message: 'Google ID token is required' });
            }
            if (!process.env.GOOGLE_CLIENT_ID) {
                return res.status(500).json({ success: false, message: 'Server is missing GOOGLE_CLIENT_ID configuration' });
            }
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            if (!payload?.email || !payload.email_verified) {
                return res.status(401).json({ success: false, message: 'Invalid Google account information' });
            }
            const email = payload.email.toLowerCase();
            const displayName = payload.name || email.split('@')[0];
            let user = await user_model_1.default.findOne({ email });
            if (!user) {
                user = new user_model_1.default({
                    email,
                    displayName,
                    isVerified: true,
                    password: `${Math.random().toString(36).slice(2)}${Date.now()}`
                });
                await user.save();
            }
            if (!user.isVerified) {
                user.isVerified = true;
                await user.save();
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.userId, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({
                success: true,
                message: 'Google login successful',
                token,
                userId: user.userId,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            });
        }
        catch (error) {
            const message = String(error?.message || 'Google authentication failed');
            if (message.includes('Wrong recipient') || message.includes('Token used too late') || message.includes('Invalid token signature')) {
                return res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
            }
            res.status(500).json({ success: false, message: 'Google authentication failed' });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const { password, balance, points, ...allowedUpdates } = req.body;
            const user = await user_model_1.default.findOneAndUpdate({ userId: req.params.id }, allowedUpdates, { new: true }).select('-password');
            if (!user)
                return res.status(404).json({ message: "User not found" });
            res.json({ success: true, message: "Profile updated successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    updatePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const user = await user_model_1.default.findOne({ userId: req.params.id });
            if (!user)
                return res.status(404).json({ message: "User not found" });
            const isMatch = await bcrypt_1.default.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Old password is incorrect" });
            }
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();
            res.json({ success: true, message: "Password updated successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
};
