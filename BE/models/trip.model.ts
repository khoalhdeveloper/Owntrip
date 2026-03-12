import mongoose, { Schema } from "mongoose";
import { ITrip } from "../interfaces/trip.interface";

const tripSchema = new Schema<ITrip>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    destination: {
      type: String,
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    totalDays: {
      type: Number,
      required: true
    },

    description: String
  },
  { timestamps: true }
);

export default mongoose.model<ITrip>("Trip", tripSchema);