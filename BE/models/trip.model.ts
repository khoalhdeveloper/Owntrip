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

    province: {
      type: String
    },

    provinceImage: {
      type: String
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

    description: String,

    isPublished: {
      type: Boolean,
      default: false
    },
    accommodation: {
      hotelId: String,
      roomTypeId: String,
      hotelName: String,
      hotelImage: String,
      checkIn: Date,
      checkOut: Date,
      totalPrice: Number
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITrip>("Trip", tripSchema);