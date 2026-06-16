import { Document, Types } from "mongoose";

export type MissionRewardType = "points" | "souvenir" | "checkin_frame";

export interface IMissionReward {
  type: MissionRewardType;
  pointsAmount?: number;
  frameId?: Types.ObjectId | string;
  souvenirId?: string;
  title?: string;
  description?: string;
}

export interface IMission extends Document {
  title: string;
  description?: string;
  imageUrl?: string;
  requiredPlaceIds: string[];
  reward: IMissionReward;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
