import mongoose, { Schema } from "mongoose";
import { IPlace } from "../interfaces/place.interface";

const placeSchema = new Schema<IPlace>(
  {
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    placeId: String
  },
  { timestamps: true }
);

export default mongoose.model<IPlace>("Place", placeSchema);