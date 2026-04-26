"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const vnpay_1 = require("../utils/vnpay");
const crypto_1 = __importDefault(require("crypto"));
const otpGenerator_1 = require("../utils/otpGenerator");
const emailService_1 = require("../utils/emailService");
exports.UserController = {
    register: async (req, res) => {
        try {
            const otp = (0, otpGenerator_1.generateOTP)();
            const otpExpires = (0, otpGenerator_1.getOTPExpiration)();
            const user = new user_model_1.default({
                ...req.body,
                otp,
                otpExpires,
                isVerified: true
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
    getAllUsers: async (req, res) => {
        try {
            const users = await user_model_1.default.find().select('-password').sort({ createdAt: -1 });
            res.json({ success: true, data: users });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    createUser: async (req, res) => {
        try {
            const { email, password, displayName, role } = req.body;
            const existingUser = await user_model_1.default.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email đã tồn tại trong hệ thống" });
            }
            const user = new user_model_1.default({
                email,
                password, // Sẽ được tự động hash qua pre('save') middleware
                displayName,
                role: role || 'user',
                isVerified: true
            });
            await user.save();
            const userData = user.toObject();
            delete userData.password;
            res.status(201).json({ success: true, message: "Tạo người dùng thành công", data: userData });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    deleteUser: async (req, res) => {
        try {
            const user = await user_model_1.default.findOneAndDelete({ userId: req.params.id });
            if (!user)
                return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
            res.json({ success: true, message: "Xóa người dùng thành công" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    adminUpdateUser: async (req, res) => {
        try {
            const { displayName, role } = req.body;
            const user = await user_model_1.default.findOneAndUpdate({ userId: req.params.id }, { displayName, role }, { new: true }).select('-password');
            if (!user)
                return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
            res.json({ success: true, message: "Cập nhật thành công", data: user });
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
                image: user.image,
                role: user.role
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    loginwithgoogle: async (req, res) => {
        try {
            const { email, displayName, avatar, image } = req.body;
            const profileImage = image || avatar;
            let user = await user_model_1.default.findOne({ email });
            if (!user) {
                user = new user_model_1.default({
                    email,
                    displayName,
                    image: profileImage,
                    isVerified: true,
                    password: await bcrypt_1.default.hash(Math.random().toString(36), 10)
                });
                await user.save();
            }
            else if (profileImage && !user.image) {
                user.image = profileImage;
                await user.save();
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.userId, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ success: true, token, userId: user.userId, image: user.image });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
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
    /**
     * API: Nạp tiền vào hệ thống → quy đổi thành points
     * POST /api/users/top-up
     * Body: { amount } (VND)
     * Tỷ lệ: 1,000 VND = 1 point
     */
    topUpBalance: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Bạn cần đăng nhập để thực hiện thao tác này" });
            }
            const { amount } = req.body;
            const parsedAmount = Number(amount);
            if (!parsedAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ success: false, message: "Số tiền nạp phải là số dương" });
            }
            if (parsedAmount < 1000) {
                return res.status(400).json({ success: false, message: "Số tiền nạp tối thiểu là 1,000 VND" });
            }
            if (parsedAmount > 500000000) {
                return res.status(400).json({ success: false, message: "Số tiền nạp tối đa là 500,000,000 VND mỗi lần" });
            }
            // 1,000 VND = 1 point
            const pointsEarned = Math.floor(parsedAmount / 1000);
            const updatedUser = await user_model_1.default.findOneAndUpdate({ userId }, { $inc: { points: pointsEarned } }, { new: true }).select('-password');
            if (!updatedUser) {
                return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            }
            return res.status(200).json({
                success: true,
                message: `Nạp tiền thành công! ${parsedAmount.toLocaleString()} VND → ${pointsEarned} points.`,
                data: {
                    amountPaid: parsedAmount,
                    pointsEarned,
                    newPoints: updatedUser.points
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * API: Thanh toán bằng points
     * POST /api/users/pay-with-points
     * Body: { pointsToUse } — số points cần trừ cho giao dịch
     */
    payWithPoints: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Bạn cần đăng nhập để thực hiện thao tác này" });
            }
            const { pointsToUse } = req.body;
            const parsedPoints = Number(pointsToUse);
            if (!parsedPoints || !Number.isInteger(parsedPoints) || parsedPoints <= 0) {
                return res.status(400).json({ success: false, message: "Số điểm quy đổi phải là số nguyên dương" });
            }
            const user = await user_model_1.default.findOne({ userId });
            if (!user) {
                return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            }
            if (user.points < parsedPoints) {
                return res.status(400).json({
                    success: false,
                    message: `Points không đủ. Bạn hiện có ${user.points} points, cần ${parsedPoints} points.`
                });
            }
            user.points -= parsedPoints;
            await user.save();
            return res.status(200).json({
                success: true,
                message: `Thanh toán thành công ${parsedPoints} points.`,
                data: {
                    pointsUsed: parsedPoints,
                    newPoints: user.points
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * API: Tạo link thanh toán VNPay để nạp tiền
     * POST /api/users/vnpay/create-payment
     * Body: { amount } (VND, tối thiểu 10,000)
     * Yêu cầu đăng nhập (verifyToken)
     */
    vnpayCreatePayment: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để thực hiện thao tác này' });
            }
            const { amount } = req.body;
            const parsedAmount = Number(amount);
            if (!parsedAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ success: false, message: 'Số tiền nạp phải là số dương' });
            }
            if (parsedAmount < 10000) {
                return res.status(400).json({ success: false, message: 'Số tiền nạp tối thiểu là 10,000 VND' });
            }
            if (parsedAmount > 500000000) {
                return res.status(400).json({ success: false, message: 'Số tiền nạp tối đa là 500,000,000 VND mỗi lần' });
            }
            // txnRef: unique per transaction (userId + timestamp + random)
            const txnRef = `${userId}-${Date.now()}-${crypto_1.default.randomBytes(3).toString('hex')}`;
            const returnUrl = process.env.VNPAY_RETURN_URL ||
                `${process.env.PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/users/vnpay/return`;
            const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.socket?.remoteAddress ||
                '127.0.0.1';
            const ipAddr = rawIp === '::1' ? '127.0.0.1' : rawIp;
            const paymentUrl = (0, vnpay_1.buildVNPayUrl)({
                amount: Math.round(parsedAmount),
                orderInfo: `NAP TIEN OWNTRIP ${userId}`,
                userId,
                returnUrl,
                ipAddr
            }, txnRef);
            return res.status(200).json({
                success: true,
                message: 'Tạo link thanh toán thành công',
                data: { paymentUrl, txnRef, amount: parsedAmount }
            });
        }
        catch (error) {
            console.error('VNPay create payment error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * API: VNPay Return
     * GET /api/users/vnpay/return
     * VNPay redirect browser về đây sau khi thanh toán.
     * Cập nhật balance + points rồi trả JSON.
     */
    vnpayReturn: async (req, res) => {
        try {
            const query = req.query;
            if (!(0, vnpay_1.verifyVNPayReturn)(query)) {
                return res.status(400).json({ success: false, message: 'Chữ ký không hợp lệ' });
            }
            const responseCode = query['vnp_ResponseCode'];
            const txnRef = query['vnp_TxnRef'] || '';
            const amount = (0, vnpay_1.parseVNPayAmount)(query['vnp_Amount'] || '0');
            const userId = txnRef.split('-')[0];
            if (!(0, vnpay_1.isVNPaySuccess)(responseCode)) {
                const codeMap = {
                    '07': 'Giao dịch bị nghi ngờ gian lận',
                    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
                    '10': 'Xác thực thẻ thất bại quá 3 lần',
                    '11': 'Giao dịch hết hạn',
                    '12': 'Thẻ/Tài khoản bị khóa',
                    '13': 'Sai mật khẩu OTP',
                    '24': 'Khách hàng hủy giao dịch',
                    '51': 'Tài khoản không đủ số dư',
                    '65': 'Vượt hạn mức giao dịch trong ngày',
                    '75': 'Ngân hàng đang bảo trì',
                    '79': 'Sai mật khẩu quá số lần quy định',
                    '99': 'Lỗi không xác định'
                };
                return res.status(200).json({
                    success: false,
                    message: codeMap[responseCode] || `Thanh toán thất bại (code: ${responseCode})`,
                    responseCode
                });
            }
            // 1,000 VND = 1 point
            const pointsEarned = Math.floor(amount / 1000);
            const updatedUser = await user_model_1.default.findOneAndUpdate({ userId }, { $inc: { points: pointsEarned } }, { new: true }).select('-password');
            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
            }
            return res.status(200).json({
                success: true,
                message: `Nạp tiền thành công! ${amount.toLocaleString()} VND → ${pointsEarned} points.`,
                data: {
                    txnRef,
                    amountPaid: amount,
                    pointsEarned,
                    newPoints: updatedUser.points
                }
            });
        }
        catch (error) {
            console.error('VNPay return error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },
};
