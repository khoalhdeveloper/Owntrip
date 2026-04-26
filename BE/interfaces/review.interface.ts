import { Document } from 'mongoose';

export interface IReview extends Document {
  reviewId: string;
  userId: string;        // Liên kết UserId00x
  targetId: string;      // HotelId hoặc TripId
  targetType: 'hotel' | 'itinerary';
  rating: number;        // Điểm tổng 1-10
  criteria: {
    cleanliness: number;
    service: number;
    facilities: number;
    valueForMoney: number;
  };
  comment: string;
  images: string[];
}