"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = express_1.default.Router();
// Lấy danh sách notification của user
router.get('/', auth_middleware_1.verifyToken, notification_controller_1.NotificationController.getAll);
// Đánh dấu đã đọc
router.patch('/:id/read', auth_middleware_1.verifyToken, notification_controller_1.NotificationController.markRead);
module.exports = router;
