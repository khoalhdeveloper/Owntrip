import mongoose, { Schema } from "mongoose";

const planPlaceSchema = new Schema(
{
  dayId: {
    type: Schema.Types.ObjectId,
    ref: "PlanDay",
    required: true
  },

  placeId: {
    type: String,
    required: true
  },

  name: String,

  address: String,

  latitude: Number,

  longitude: Number,

  rating: Number,

  photo: String,

  mapUrl: String,

  order: {
    type: Number,
    default: 1
  }

},
{ timestamps: true }
);

export default mongoose.model("PlanPlace", planPlaceSchema);