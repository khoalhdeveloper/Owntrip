import mongoose, { Schema } from "mongoose";

const tripExpenseSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true
    },
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      enum: ["hotel", "food", "transport", "ticket", "shopping", "other"],
      default: "other"
    },
    title: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: Date
  },
  { timestamps: true }
);

tripExpenseSchema.index({ tripId: 1, userId: 1, createdAt: -1 });

export default mongoose.model("TripExpense", tripExpenseSchema);
