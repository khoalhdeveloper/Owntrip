import mongoose, { Schema } from "mongoose";
import { ICheckin } from "../interfaces/checkin.interface";

const checkinSchema = new Schema<ICheckin>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    placeId: {
      type: String
    },
    imageUri: {
      type: String,
      default: ""
    },
    title: {
      type: String,
      required: true,
      default: "Kỷ niệm Check-in"
    },
    date: {
      type: String,
      required: true
    },
    userLocation: {
      latitude: Number,
      longitude: Number
    },
    distanceMeters: {
      type: Number
    },
    source: {
      type: String,
      enum: ["location", "photo_booth"],
      default: "photo_booth"
    },
    checkedInAt: {
      type: Date
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model<ICheckin>("Checkin", checkinSchema);
