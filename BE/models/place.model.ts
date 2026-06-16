import mongoose, { Schema } from "mongoose";
import { IPlace } from "../interfaces/place.interface";

const placeSchema = new Schema<IPlace>(
  {
    placeId: { type: String, unique: true },
    name: { type: String, required: true },
    category: String,
    city: String,
    address: String,
    location: {
      lat: Number,
      lng: Number
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    price: String,
    phoneNumber: String,
    website: String,
    images: [String],
    openingHours: String,
    preferences: [String],
    source: { type: String, default: "Google Maps" },
    addedCount: { type: Number, default: 0 },
    isCheckinEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<IPlace>("Place", placeSchema);
