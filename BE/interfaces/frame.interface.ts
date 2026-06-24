import { Document } from 'mongoose';

export interface IFrame extends Document {
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  province?: string;
  destinationTags?: string[];
  isDefault?: boolean;
  unlockCondition?: 'none' | 'checkin_at_location' | 'mission_reward' | 'purchase';
  unlockType: 'free' | 'mission';
  layoutType: 'single' | 'filmstrip-4';
  slotsCount: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
