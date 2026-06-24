import { Response } from "express";
import Checkin from "../models/checkin.model";
import Memory from "../models/memory.model";
import Trip from "../models/trip.model";
import { AuthRequest } from "../middlewares/auth.middleware";

const normalizeTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
};

const assertTripOwner = async (tripId: string | undefined, userId: string) => {
  if (!tripId) {
    return true;
  }

  const trip = await Trip.findOne({ _id: tripId, userId });
  return Boolean(trip);
};

const assertCheckinOwner = async (checkinId: string | undefined, userId: string) => {
  if (!checkinId) {
    return true;
  }

  const checkin = await Checkin.findOne({ _id: checkinId, userId });
  return Boolean(checkin);
};

export const createMemory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    const { tripId, checkinId, imageUrl, caption, locationName, province, tags } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Cần truyền imageUrl" });
    }

    if (!(await assertTripOwner(tripId, userId)) || !(await assertCheckinOwner(checkinId, userId))) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền tạo kỷ niệm này"
      });
    }

    const memory = await Memory.create({
      userId,
      tripId,
      checkinId,
      imageUrl,
      caption: caption || "",
      locationName,
      province,
      tags: normalizeTags(tags)
    });

    return res.status(201).json({
      success: true,
      message: "Tạo kỷ niệm thành công",
      memory
    });
  } catch (error) {
    console.error("Create memory error:", error);
    return res.status(500).json({ success: false, message: "Không thể tạo kỷ niệm" });
  }
};

export const getMyMemories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    const memories = await Memory.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, total: memories.length, memories });
  } catch (error) {
    console.error("Get memories error:", error);
    return res.status(500).json({ success: false, message: "Không thể tải danh sách kỷ niệm" });
  }
};

export const getTripMemories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tripId = String(req.params.tripId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (!(await assertTripOwner(tripId, userId))) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem kỷ niệm của chuyến đi này"
      });
    }

    const memories = await Memory.find({ userId, tripId }).sort({ createdAt: -1 });
    return res.json({ success: true, total: memories.length, memories });
  } catch (error) {
    console.error("Get trip memories error:", error);
    return res.status(500).json({ success: false, message: "Không thể tải kỷ niệm của chuyến đi" });
  }
};

export const deleteMemory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    const memory = await Memory.findOneAndDelete({ _id: id, userId });
    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kỷ niệm hoặc bạn không có quyền thao tác"
      });
    }

    return res.json({ success: true, message: "Xóa kỷ niệm thành công" });
  } catch (error) {
    console.error("Delete memory error:", error);
    return res.status(500).json({ success: false, message: "Không thể xóa kỷ niệm" });
  }
};
