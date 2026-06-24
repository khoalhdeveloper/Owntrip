import { Response } from "express";
import Trip from "../models/trip.model";
import TripChecklist from "../models/tripChecklist.model";
import { AuthRequest } from "../middlewares/auth.middleware";

const assertTripOwner = async (tripId: string, userId: string) => {
  const trip = await Trip.findOne({ _id: tripId, userId });
  return Boolean(trip);
};

const normalizeItems = (items: any[]) => {
  return items.map((item) => ({
    id: String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    title: String(item.title || "").trim(),
    category: item.category || "other",
    checked: Boolean(item.checked)
  })).filter((item) => item.title.length > 0);
};

export const getTripChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tripId = String(req.params.tripId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (!(await assertTripOwner(tripId, userId))) {
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
      });
    }

    const checklist = await TripChecklist.findOne({ tripId, userId });
    return res.json({
      success: true,
      checklist: checklist || { tripId, userId, items: [] }
    });
  } catch (error) {
    console.error("Get checklist error:", error);
    return res.status(500).json({ success: false, message: "Không thể tải checklist" });
  }
};

export const updateTripChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tripId = String(req.params.tripId);
    const { items } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "items phải là một mảng" });
    }

    if (!(await assertTripOwner(tripId, userId))) {
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
      });
    }

    const checklist = await TripChecklist.findOneAndUpdate(
      { tripId, userId },
      { $set: { items: normalizeItems(items) } },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Cập nhật checklist thành công",
      checklist
    });
  } catch (error) {
    console.error("Update checklist error:", error);
    return res.status(500).json({ success: false, message: "Không thể cập nhật checklist" });
  }
};
