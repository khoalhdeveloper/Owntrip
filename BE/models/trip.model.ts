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
    
    notes: {
      type: [String],
      default: []
    },

    budget: {
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      activities: { type: Number, default: 0 }
    },

    members: {
      type: [String],
      default: []
    },

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
    },
    
    // Marketplace Fields
    isForSale: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0
    },
    soldCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    isTrusted: {
      type: Boolean,
      default: false
    },
    isPurchasedClone: {
      type: Boolean,
      default: false
    },
    originalTripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip'
    },
    originalCreatorId: {
      type: String,
      ref: 'User'
    },
    shareToken: {
      type: String,
      sparse: true,
      unique: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITrip>("Trip", tripSchema);