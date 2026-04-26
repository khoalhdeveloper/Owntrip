"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const avatarItem_controller_1 = require("../controllers/avatarItem.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public: Lấy danh sách item đang bán (cho người dùng)
router.get('/shop', avatarItem_controller_1.AvatarItemController.getShopItems);
// Admin: Lấy toàn bộ item (cả ẩn lẫn hiện)
router.get('/', auth_middleware_1.verifyToken, avatarItem_controller_1.AvatarItemController.getAll);
// Admin: Tạo item mới
router.post('/', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), avatarItem_controller_1.AvatarItemController.create);
// Admin: Cập nhật item
router.put('/:id', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), avatarItem_controller_1.AvatarItemController.update);
// Admin: Xóa item
router.delete('/:id', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), avatarItem_controller_1.AvatarItemController.delete);
// Admin: Bật/tắt trạng thái bán
router.patch('/:id/toggle', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), avatarItem_controller_1.AvatarItemController.toggleActive);
module.exports = router;
