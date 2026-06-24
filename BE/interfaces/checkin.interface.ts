import { Document } from 'mongoose';

export interface ICheckin extends Document {
  userId: string;
  placeId?: string;
  imageUri: string;
  title: string;
  date: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  distanceMeters?: number;
  source?: 'location' | 'photo_booth';
  checkedInAt?: Date;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
