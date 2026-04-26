import { Router } from 'express';
import { AvatarItemController } from '../controllers/avatarItem.controller';
import { verifyToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public: Lấy danh sách item đang bán (cho người dùng)
router.get('/shop', AvatarItemController.getShopItems);

// Admin: Lấy toàn bộ item (cả ẩn lẫn hiện)
router.get('/', verifyToken, AvatarItemController.getAll);

// Admin: Tạo item mới
router.post('/', verifyToken, authorizeRole(['admin']), AvatarItemController.create);

// Admin: Cập nhật item
router.put('/:id', verifyToken, authorizeRole(['admin']), AvatarItemController.update);

// Admin: Xóa item
router.delete('/:id', verifyToken, authorizeRole(['admin']), AvatarItemController.delete);

// Admin: Bật/tắt trạng thái bán
router.patch('/:id/toggle', verifyToken, authorizeRole(['admin']), AvatarItemController.toggleActive);

module.exports = router;
