import { Document, Types } from "mongoose";

export interface IPlanDay extends Document {
  tripId: Types.ObjectId
  dayNumber: number
  date: Date
}