import { Document } from "mongoose";

export interface IPlace extends Document {
  placeId: string;
  name: string;
  category: string;
  city: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  price: string;
  phoneNumber: string;
  website: string;
  images: string[];
  openingHours: string;
  preferences: string[];
  source: string;
  addedCount: number;
  isCheckinEnabled?: boolean;
}
