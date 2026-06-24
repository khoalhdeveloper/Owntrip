import { Response } from "express";
import Trip from "../models/trip.model";
import TripExpense from "../models/tripExpense.model";
import { AuthRequest } from "../middlewares/auth.middleware";

const assertTripOwner = async (tripId: string, userId: string) => {
  const trip = await Trip.findOne({ _id: tripId, userId });
  return Boolean(trip);
};

const parseAmount = (amount: unknown) => {
  const parsed = Number(amount);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const getTripExpenses = async (req: AuthRequest, res: Response) => {
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

    const expenses = await TripExpense.find({ tripId, userId }).sort({ date: -1, createdAt: -1 });

    const trip = await Trip.findById(tripId);
    let balances: any = [];
    if (trip && trip.members && trip.members.length > 0) {
      const members = trip.members;
      const memberCount = members.length;
      const balancesMap: Record<string, number> = {};
      members.forEach(m => balancesMap[m] = 0);
      
      let totalSharedAmount = 0;
      
      expenses.forEach((expense: any) => {
        if (expense.isShared && expense.payer && members.includes(expense.payer)) {
          totalSharedAmount += expense.amount;
          balancesMap[expense.payer] += expense.amount;
        }
      });
      
      const avgAmount = totalSharedAmount / memberCount;
      
      balances = members.map(member => ({
        member,
        paid: balancesMap[member],
        balance: balancesMap[member] - avgAmount
      }));
    }

    return res.json({ success: true, total: expenses.length, expenses, balances });
  } catch (error) {
    console.error("Get expenses error:", error);
    return res.status(500).json({ success: false, message: "Không thể tải danh sách chi phí" });
  }
};

export const createTripExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tripId = String(req.params.tripId);
    const { category, title, amount, date, payer, isShared } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (!(await assertTripOwner(tripId, userId))) {
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
      });
    }

    const parsedAmount = parseAmount(amount);
    if (!title || parsedAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Cần nhập tiêu đề và số tiền không âm"
      });
    }

    const expense = await TripExpense.create({
      tripId,
      userId,
      category: category || "other",
      title,
      amount: parsedAmount,
      payer,
      isShared: Boolean(isShared),
      date: date ? new Date(date) : undefined
    });

    return res.status(201).json({
      success: true,
      message: "Tạo chi phí thành công",
      expense
    });
  } catch (error) {
    console.error("Create expense error:", error);
    return res.status(500).json({ success: false, message: "Không thể tạo chi phí" });
  }
};

export const updateTripExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tripId = String(req.params.tripId);
    const expenseId = String(req.params.expenseId);
    const updateData: Record<string, any> = {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (!(await assertTripOwner(tripId, userId))) {
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
      });
    }

    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.payer !== undefined) updateData.payer = req.body.payer;
    if (req.body.isShared !== undefined) updateData.isShared = Boolean(req.body.isShared);
    if (req.body.date !== undefined) updateData.date = req.body.date ? new Date(req.body.date) : undefined;
    if (req.body.amount !== undefined) {
      const parsedAmount = parseAmount(req.body.amount);
      if (parsedAmount === null) {
        return res.status(400).json({ success: false, message: "Số tiền phải không âm" });
      }
      updateData.amount = parsedAmount;
    }

    const expense = await TripExpense.findOneAndUpdate(
      { _id: expenseId, tripId, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi phí hoặc bạn không có quyền thao tác"
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật chi phí thành công",
      expense
    });
  } catch (error) {
    console.error("Update expense error:", error);
    return res.status(500).json({ success: false, message: "Không thể cập nhật chi phí" });
  }
};

export const deleteTripExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tripId = String(req.params.tripId);
    const expenseId = String(req.params.expenseId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    if (!(await assertTripOwner(tripId, userId))) {
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
      });
    }

    const expense = await TripExpense.findOneAndDelete({ _id: expenseId, tripId, userId });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi phí hoặc bạn không có quyền thao tác"
      });
    }

    return res.json({ success: true, message: "Xóa chi phí thành công" });
  } catch (error) {
    console.error("Delete expense error:", error);
    return res.status(500).json({ success: false, message: "Không thể xóa chi phí" });
  }
};
