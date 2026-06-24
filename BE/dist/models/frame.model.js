"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Schema Mongoose cho Frame ảnh check-in
const frameSchema = new mongoose_1.Schema({
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
{ timestamps: true });
exports.default = mongoose_1.default.model("Frame", frameSchema);
