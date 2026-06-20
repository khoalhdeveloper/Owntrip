import mongoose, { Schema } from "mongoose";

const checklistItemSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ["documents", "clothes", "tech", "health", "money", "other"],
      default: "other"
    },
    checked: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const tripChecklistSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true
    },
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    items: {
      type: [checklistItemSchema],
      default: []
    }
  },
  { timestamps: true }
);

tripChecklistSchema.index({ tripId: 1, userId: 1 }, { unique: true });

export default mongoose.model("TripChecklist", tripChecklistSchema);
