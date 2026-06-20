"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTripExpense = exports.updateTripExpense = exports.createTripExpense = exports.getTripExpenses = void 0;
const trip_model_1 = __importDefault(require("../models/trip.model"));
const tripExpense_model_1 = __importDefault(require("../models/tripExpense.model"));
const assertTripOwner = async (tripId, userId) => {
    const trip = await trip_model_1.default.findOne({ _id: tripId, userId });
    return Boolean(trip);
};
const parseAmount = (amount) => {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const getTripExpenses = async (req, res) => {
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
        const expenses = await tripExpense_model_1.default.find({ tripId, userId }).sort({ date: -1, createdAt: -1 });
        return res.json({ success: true, total: expenses.length, expenses });
    }
    catch (error) {
        console.error("Get expenses error:", error);
        return res.status(500).json({ success: false, message: "Không thể tải danh sách chi phí" });
    }
};
exports.getTripExpenses = getTripExpenses;
const createTripExpense = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const tripId = String(req.params.tripId);
        const { category, title, amount, date } = req.body;
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
        const expense = await tripExpense_model_1.default.create({
            tripId,
            userId,
            category: category || "other",
            title,
            amount: parsedAmount,
            date: date ? new Date(date) : undefined
        });
        return res.status(201).json({
            success: true,
            message: "Tạo chi phí thành công",
            expense
        });
    }
    catch (error) {
        console.error("Create expense error:", error);
        return res.status(500).json({ success: false, message: "Không thể tạo chi phí" });
    }
};
exports.createTripExpense = createTripExpense;
const updateTripExpense = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const tripId = String(req.params.tripId);
        const expenseId = String(req.params.expenseId);
        const updateData = {};
        if (!userId) {
            return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
        }
        if (!(await assertTripOwner(tripId, userId))) {
            return res.status(403).json({
                success: false,
                message: "Không tìm thấy chuyến đi hoặc bạn không có quyền thao tác"
            });
        }
        if (req.body.category !== undefined)
            updateData.category = req.body.category;
        if (req.body.title !== undefined)
            updateData.title = req.body.title;
        if (req.body.date !== undefined)
            updateData.date = req.body.date ? new Date(req.body.date) : undefined;
        if (req.body.amount !== undefined) {
            const parsedAmount = parseAmount(req.body.amount);
            if (parsedAmount === null) {
                return res.status(400).json({ success: false, message: "Số tiền phải không âm" });
            }
            updateData.amount = parsedAmount;
        }
        const expense = await tripExpense_model_1.default.findOneAndUpdate({ _id: expenseId, tripId, userId }, { $set: updateData }, { new: true, runValidators: true });
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
    }
    catch (error) {
        console.error("Update expense error:", error);
        return res.status(500).json({ success: false, message: "Không thể cập nhật chi phí" });
    }
};
exports.updateTripExpense = updateTripExpense;
const deleteTripExpense = async (req, res) => {
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
        const expense = await tripExpense_model_1.default.findOneAndDelete({ _id: expenseId, tripId, userId });
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy chi phí hoặc bạn không có quyền thao tác"
            });
        }
        return res.json({ success: true, message: "Xóa chi phí thành công" });
    }
    catch (error) {
        console.error("Delete expense error:", error);
        return res.status(500).json({ success: false, message: "Không thể xóa chi phí" });
    }
};
exports.deleteTripExpense = deleteTripExpense;
