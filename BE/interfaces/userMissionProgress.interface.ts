import { Document, Types } from "mongoose";

export interface IUserMissionProgress extends Document {
  userId: string;
  missionId: Types.ObjectId;
  checkedPlaceIds: string[];
  completedAt?: Date;
  rewardGrantedAt?: Date;
  rewardClaimedAt?: Date;
  rewardResult?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
