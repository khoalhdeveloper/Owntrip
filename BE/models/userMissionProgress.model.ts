import mongoose, { Schema } from "mongoose";
import { IUserMissionProgress } from "../interfaces/userMissionProgress.interface";

const userMissionProgressSchema = new Schema<IUserMissionProgress>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    missionId: {
      type: Schema.Types.ObjectId,
      ref: "Mission",
      required: true
    },
    checkedPlaceIds: [{ type: String }],
    completedAt: { type: Date },
    rewardGrantedAt: { type: Date },
    rewardClaimedAt: { type: Date },
    rewardResult: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

userMissionProgressSchema.index({ userId: 1, missionId: 1 }, { unique: true });

export default mongoose.model<IUserMissionProgress>(
  "UserMissionProgress",
  userMissionProgressSchema
);
