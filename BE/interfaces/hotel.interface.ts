import { Document } from 'mongoose';

export interface IRoomType {
  roomTypeId: string;
  name: string;          // Deluxe, Suite, Family
  description: string;
  images: string[];
  capacity: number;
  basePrice: number;     // Giá gốc
  amenities: string[];   // ["Wifi", "Bồn tắm"]
}

export interface IHotel extends Document {
  hotelId: string;
  name: string;
  starRating: number;
  address: {
    fullAddress: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  images: string[];
  description: string;
  rooms: IRoomType[];
  reviewSummary: {
    score: number;       // Ví dụ: 8.6
    count: number;       // 6.065 bài đánh giá
    cleanliness: number;
    service: number;
    valueForMoney: number;
  };
  tags: string[];        // ["Bán chạy nhất", "2024"]
}