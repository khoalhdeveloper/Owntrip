import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Route tạo inventory hàng loạt (Bắt buộc đăng nhập - Admin)
router.post('/bulk-create', verifyToken, InventoryController.bulkCreateInventory);

// Route xem inventory theo khoảng thời gian (Công khai)
router.get('/', InventoryController.getInventory);

// Route cập nhật 1 inventory (Bắt buộc đăng nhập - Admin)
router.put('/:id', verifyToken, InventoryController.updateInventory);

// Route cập nhật giá hàng loạt (Bắt buộc đăng nhập - Admin)
router.post('/bulk-price-update', verifyToken, InventoryController.bulkPriceUpdate);

// Route xóa inventory (Bắt buộc đăng nhập - Admin)
router.delete('/', verifyToken, InventoryController.deleteInventory);

// Route dashboard thống kê (Công khai hoặc Admin)
router.get('/dashboard', InventoryController.getDashboard);

module.exports = router;
