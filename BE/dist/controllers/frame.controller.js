"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderFrames = exports.toggleFrameActive = exports.deleteFrame = exports.updateFrame = exports.createFrame = exports.getAllFramesAdmin = exports.getMyUnlockedFrames = exports.getFrames = void 0;
const frame_model_1 = __importDefault(require("../models/frame.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// ─── Helper: Tạo thumbnail URL từ Cloudinary imageUrl ────────────────────────
// Cloudinary hỗ trợ transformation qua URL — chèn "w_200,c_scale" vào path
const buildThumbnailUrl = (imageUrl) => {
    return imageUrl.replace('/upload/', '/upload/w_200,c_scale/');
};
// ─── Helper: Lấy public_id từ Cloudinary URL để xóa ảnh ─────────────────────
// URL dạng: https://res.cloudinary.com/{cloud}/image/upload/{version}/{public_id}.{ext}
const extractPublicId = (imageUrl) => {
    const parts = imageUrl.split('/upload/');
    if (parts.length < 2)
        return '';
    const afterUpload = parts[1]; // "v1234567/frames/abc.png"
    const withoutVersion = afterUpload.replace(/^v\d+\//, ''); // "frames/abc.png"
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, ''); // "frames/abc"
    return withoutExt;
};
// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────
/**
 * [PUBLIC] Lấy danh sách frame đang kích hoạt (isActive: true)
 * Sắp xếp theo trường order tăng dần
 */
const getFrames = async (req, res) => {
    try {
        const frames = await frame_model_1.default.find({ isActive: true }).sort({ order: 1 });
        return res.json({
            success: true,
            total: frames.length,
            frames
        });
    }
    catch (error) {
        console.error("Lỗi lấy danh sách frame:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách frame",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getFrames = getFrames;
/**
 * [USER] Get active frames available to the current user.
 * Includes all free frames and mission frames already unlocked by rewards.
 */
const getMyUnlockedFrames = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const user = await user_model_1.default.findOne({ userId }).select("unlockedCheckinFrameIds");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay nguoi dung"
            });
        }
        const unlockedFrameIds = user.unlockedCheckinFrameIds || [];
        const frames = await frame_model_1.default.find({
            isActive: true,
            $or: [
                { unlockType: "free" },
                { _id: { $in: unlockedFrameIds } }
            ]
        }).sort({ order: 1 });
        const unlockedIdSet = new Set(unlockedFrameIds.map((id) => id.toString()));
        const framesWithUnlockStatus = frames.map((frame) => ({
            ...frame.toObject(),
            isUnlocked: frame.unlockType === "free" || unlockedIdSet.has(frame._id.toString())
        }));
        return res.json({
            success: true,
            total: framesWithUnlockStatus.length,
            frames: framesWithUnlockStatus
        });
    }
    catch (error) {
        console.error("Get unlocked frames error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the lay danh sach frame da mo khoa",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getMyUnlockedFrames = getMyUnlockedFrames;
// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
/**
 * [ADMIN] Lấy tất cả frame kể cả frame đang ẩn (isActive: false)
 * Sắp xếp theo order tăng dần
 */
const getAllFramesAdmin = async (req, res) => {
    try {
        const frames = await frame_model_1.default.find().sort({ order: 1 });
        return res.json({
            success: true,
            total: frames.length,
            frames
        });
    }
    catch (error) {
        console.error("Lỗi lấy tất cả frame (admin):", error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách frame",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getAllFramesAdmin = getAllFramesAdmin;
/**
 * [ADMIN] Tạo frame mới với upload ảnh lên Cloudinary
 * Dùng multipart/form-data, field ảnh là "image"
 * Body: name, category?, layoutType?, slotsCount?, order?
 */
const createFrame = async (req, res) => {
    try {
        const { name, category, unlockType, layoutType, slotsCount, order } = req.body;
        // Kiểm tra tên frame
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc: name"
            });
        }
        // Kiểm tra file upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Thiếu file ảnh PNG cho frame (field: image)"
            });
        }
        // Lấy URL ảnh đã upload lên Cloudinary từ multer-storage-cloudinary
        const imageUrl = req.file.path;
        // Tự động tạo thumbnail width 200px qua Cloudinary URL transformation
        const thumbnailUrl = buildThumbnailUrl(imageUrl);
        const frame = await frame_model_1.default.create({
            name,
            imageUrl,
            thumbnailUrl,
            category: category || "general",
            unlockType: unlockType || "free",
            layoutType: layoutType || "single",
            slotsCount: slotsCount || 1,
            order: order || 0,
            isActive: true
        });
        return res.status(201).json({
            success: true,
            message: "Tạo frame thành công",
            frame
        });
    }
    catch (error) {
        console.error("Lỗi tạo frame:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể tạo frame",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.createFrame = createFrame;
/**
 * [ADMIN] Cập nhật thông tin frame theo id
 * Nếu upload file mới: thay imageUrl + thumbnailUrl, xóa ảnh cũ trên Cloudinary
 * Nếu không upload file: chỉ cập nhật các field trong body
 */
const updateFrame = async (req, res) => {
    try {
        const { id } = req.params;
        // Tìm frame hiện tại để lấy imageUrl cũ (nếu cần xóa)
        const existingFrame = await frame_model_1.default.findById(id);
        if (!existingFrame) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy frame"
            });
        }
        const updateData = { ...req.body };
        // Nếu có file upload mới → cập nhật URL và xóa ảnh cũ trên Cloudinary
        if (req.file) {
            const newImageUrl = req.file.path;
            const newThumbUrl = buildThumbnailUrl(newImageUrl);
            updateData.imageUrl = newImageUrl;
            updateData.thumbnailUrl = newThumbUrl;
            // Xóa ảnh cũ trên Cloudinary (không chặn luồng chính nếu thất bại)
            const oldPublicId = extractPublicId(existingFrame.imageUrl);
            if (oldPublicId) {
                cloudinary_1.default.uploader.destroy(oldPublicId).catch((err) => {
                    console.warn("Không thể xóa ảnh cũ trên Cloudinary:", err);
                });
            }
        }
        const frame = await frame_model_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
        return res.json({
            success: true,
            message: "Cập nhật frame thành công",
            frame
        });
    }
    catch (error) {
        console.error("Lỗi cập nhật frame:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật frame",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.updateFrame = updateFrame;
/**
 * [ADMIN] Xóa vĩnh viễn frame theo id
 * Đồng thời xóa ảnh tương ứng trên Cloudinary
 */
const deleteFrame = async (req, res) => {
    try {
        const { id } = req.params;
        const frame = await frame_model_1.default.findByIdAndDelete(id);
        if (!frame) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy frame"
            });
        }
        // Xóa ảnh trên Cloudinary sau khi xóa document khỏi DB
        const publicId = extractPublicId(frame.imageUrl);
        if (publicId) {
            try {
                await cloudinary_1.default.uploader.destroy(publicId);
                console.log(`Đã xóa ảnh Cloudinary: ${publicId}`);
            }
            catch (cloudErr) {
                // Log nhưng không trả lỗi về client — frame đã bị xóa khỏi DB rồi
                console.warn("Không thể xóa ảnh Cloudinary:", cloudErr);
            }
        }
        return res.json({
            success: true,
            message: "Đã xóa frame thành công"
        });
    }
    catch (error) {
        console.error("Lỗi xóa frame:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xóa frame",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.deleteFrame = deleteFrame;
/**
 * [ADMIN] Bật / tắt trạng thái isActive của frame
 * PATCH /:id/toggle
 */
const toggleFrameActive = async (req, res) => {
    try {
        const { id } = req.params;
        const frame = await frame_model_1.default.findById(id);
        if (!frame) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy frame"
            });
        }
        // Đảo ngược trạng thái hiển thị
        frame.isActive = !frame.isActive;
        await frame.save();
        return res.json({
            success: true,
            message: frame.isActive ? "Đã kích hoạt frame" : "Đã ẩn frame",
            frame
        });
    }
    catch (error) {
        console.error("Lỗi toggle trạng thái frame:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể thay đổi trạng thái frame",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.toggleFrameActive = toggleFrameActive;
/**
 * [ADMIN] Cập nhật thứ tự hiển thị hàng loạt
 * PATCH /reorder
 * Body: { frames: [{ id: string, order: number }, ...] }
 */
const reorderFrames = async (req, res) => {
    try {
        const { frames } = req.body;
        if (!Array.isArray(frames) || frames.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ: cần truyền mảng frames [{id, order}]"
            });
        }
        // Cập nhật song song tất cả frame trong danh sách
        const updatePromises = frames.map(({ id, order }) => frame_model_1.default.findByIdAndUpdate(id, { $set: { order } }, { new: true }));
        await Promise.all(updatePromises);
        return res.json({
            success: true,
            message: `Đã cập nhật thứ tự cho ${frames.length} frame`
        });
    }
    catch (error) {
        console.error("Lỗi sắp xếp lại frame:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật thứ tự frame",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.reorderFrames = reorderFrames;
