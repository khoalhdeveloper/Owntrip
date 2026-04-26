import { Document } from 'mongoose';

export interface IAvatarItem extends Document {
  itemId: string;
  name: string;
  type: 'frame' | 'avatar';
  imageUrl: string;
  previewUrl?: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
