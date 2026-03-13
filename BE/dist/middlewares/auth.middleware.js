"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để thực hiện thao tác này' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (err) {
        return res.status(403).json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
    }
};
exports.verifyToken = verifyToken;
const authorizeRole = (roles) => {
    const allowedRoles = typeof roles === 'string' ? [roles] : roles;
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập vào chức năng này'
            });
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
