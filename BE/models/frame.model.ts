import mongoose, { Schema } from "mongoose";
import { IFrame } from "../interfaces/frame.interface";

// Schema Mongoose cho Frame ảnh check-in
const frameSchema = new Schema<IFrame>(
  {
    // Tên hiển thị của frame
    name: {
      type: String,
      required: true,
      trim: true
    },

    // URL ảnh frame đầy đủ (upload lên Cloudinary)
    imageUrl: {
      type: String,
      required: true
    },

    // URL ảnh thu nhỏ để preview nhanh (tùy chọn)
    thumbnailUrl: {
      type: String,
      default: ""
    },

    // Danh mục frame (general, travel, holiday, seasonal...)
    category: {
      type: String,
      default: "general",
      trim: true
    },

    province: {
      type: String,
      trim: true
    },

    destinationTags: {
      type: [String],
      default: []
    },

    isDefault: {
      type: Boolean,
      default: false
    },

    unlockCondition: {
      type: String,
      enum: ["none", "checkin_at_location", "mission_reward", "purchase"],
      default: "none"
    },

    unlockType: {
      type: String,
      enum: ["free", "mission"],
      default: "free"
    },

    // Kiểu bố cục: 'single' (1 ô) hoặc 'filmstrip-4' (4 ô dạng dải film)
    layoutType: {
      type: String,
      enum: ["single", "filmstrip-4"],
      default: "single"
    },

    // Số lượng ô ảnh tương ứng với layoutType
    slotsCount: {
      type: Number,
      default: 1
    },

    // Trạng thái hiển thị: true = đang kích hoạt, false = ẩn
    isActive: {
      type: Boolean,
      default: true
    },

    // Thứ tự sắp xếp (số càng nhỏ hiển thị càng trước)
    order: {
      type: Number,
      default: 0
    }
  },
  // Tự động thêm createdAt và updatedAt
  { timestamps: true }
);

export default mongoose.model<IFrame>("Frame", frameSchema);
