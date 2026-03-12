import { Document, Types } from "mongoose";

export interface ITrip extends Document {
  userId: string
  title: string
  destination: string
  startDate: Date
  endDate: Date
  totalDays: number
  description?: string
}