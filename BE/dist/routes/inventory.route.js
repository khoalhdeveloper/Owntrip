"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Route tạo inventory hàng loạt (Bắt buộc đăng nhập - Admin)
router.post('/bulk-create', auth_middleware_1.verifyToken, inventory_controller_1.InventoryController.bulkCreateInventory);
// Route xem inventory theo khoảng thời gian (Công khai)
router.get('/', inventory_controller_1.InventoryController.getInventory);
// Route cập nhật 1 inventory (Bắt buộc đăng nhập - Admin)
router.put('/:id', auth_middleware_1.verifyToken, inventory_controller_1.InventoryController.updateInventory);
// Route cập nhật giá hàng loạt (Bắt buộc đăng nhập - Admin)
router.post('/bulk-price-update', auth_middleware_1.verifyToken, inventory_controller_1.InventoryController.bulkPriceUpdate);
// Route xóa inventory (Bắt buộc đăng nhập - Admin)
router.delete('/', auth_middleware_1.verifyToken, inventory_controller_1.InventoryController.deleteInventory);
// Route dashboard thống kê (Công khai hoặc Admin)
router.get('/dashboard', inventory_controller_1.InventoryController.getDashboard);
module.exports = router;
