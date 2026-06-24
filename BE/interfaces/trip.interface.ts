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
  notes?: string[]
  budget?: {
    accommodation: number
    food: number
    transport: number
    activities: number
  }
  members?: string[]
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
  isForSale?: boolean
  price?: number
  soldCount?: number
  averageRating?: number
  totalReviews?: number
  isTrusted?: boolean
  isPurchasedClone?: boolean
  originalTripId?: Types.ObjectId
  originalCreatorId?: string
  shareToken?: string
}