import mongoose from "mongoose";
import dotenv from "dotenv";
import Mission from "../models/mission.model";

dotenv.config();

const activeMissionFilter = () => {
  const currentDate = new Date();
  console.log("Current date for query:", currentDate);

  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: currentDate } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: currentDate } }] }
    ]
  };
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || "");
  console.log("Connected to MongoDB");

  const filter = activeMissionFilter();
  console.log("Using filter:", JSON.stringify(filter, null, 2));

  const missions = await Mission.find(filter).sort({ order: 1 });
  console.log("Active missions returned:", JSON.stringify(missions, null, 2));

  await mongoose.disconnect();
};

run().catch(console.error);
