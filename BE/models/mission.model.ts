import mongoose, { Schema } from "mongoose";
import { IMission } from "../interfaces/mission.interface";

const missionRewardSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["points", "souvenir", "checkin_frame"],
      required: true
    },
    pointsAmount: { type: Number, default: 0 },
    frameId: { type: Schema.Types.ObjectId, ref: "Frame" },
    souvenirId: { type: String },
    title: { type: String },
    description: { type: String }
  },
  { _id: false }
);

const missionSchema = new Schema<IMission>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    requiredPlaceIds: [{ type: String, required: true }],
    reward: { type: missionRewardSchema, required: true },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

missionSchema.index({ isActive: 1, order: 1 });
missionSchema.index({ requiredPlaceIds: 1 });

export default mongoose.model<IMission>("Mission", missionSchema);
