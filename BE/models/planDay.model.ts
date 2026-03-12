import mongoose, { Schema } from "mongoose";
import { IPlanDay } from "../interfaces/planDay.interface";

const planDaySchema = new Schema<IPlanDay>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip"
    },
    dayNumber: Number,
    date: Date
  },
  { timestamps: true }
);

export default mongoose.model<IPlanDay>("PlanDay", planDaySchema);