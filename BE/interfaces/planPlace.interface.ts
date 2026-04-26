import { Document, Types } from "mongoose";

export interface IPlanPlace extends Document {
  dayId: Types.ObjectId
  placeName: string
  address: string
  lat: number
  lng: number
  order: number
  note?: string
}