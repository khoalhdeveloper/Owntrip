import { Document } from 'mongoose';

export interface IFrame extends Document {
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  unlockType: 'free' | 'mission';
  layoutType: 'single' | 'filmstrip-4';
  slotsCount: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
