import mongoose, { Schema } from "mongoose";

const memorySchema = new Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip"
    },
    checkinId: {
      type: Schema.Types.ObjectId,
      ref: "Checkin"
    },
    imageUrl: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ""
    },
    locationName: String,
    province: String,
    tags: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Memory", memorySchema);
