import { Document, Types } from "mongoose";

export interface ITrip extends Document {
  userId: string
  title: string
  destination: string
  province?: string
  provinceImage?: string
  startDate: Date
  endDate: Date
  totalDays: number
  description?: string
  isPublished: boolean
  accommodation?: {
    hotelId: string
    roomTypeId: string
    hotelName: string
    hotelImage?: string
    checkIn: Date
    checkOut: Date
    totalPrice: number
  }
}