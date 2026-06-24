import mongoose from "mongoose";
import dotenv from "dotenv";
import Mission from "../models/mission.model";
import UserMissionProgress from "../models/userMissionProgress.model";

dotenv.config();

const activeMissionFilter = () => {
  const currentDate = new Date();
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

  const userId = "UserId002";
  const missions = await Mission.find(activeMissionFilter()).sort({ order: 1 });
  const missionIds = missions.map((mission) => mission._id);
  const progresses = await UserMissionProgress.find({
    userId,
    missionId: { $in: missionIds }
  });

  const progressByMissionId = new Map(
    progresses.map((progress) => [String(progress.missionId), progress])
  );

  const items = missions.map((mission) => {
    const progress = progressByMissionId.get(String(mission._id));
    const checkedPlaceIds = progress?.checkedPlaceIds || [];

    return {
      mission,
      progress: progress || null,
      checkedPlaceIds,
      requiredCount: mission.requiredPlaceIds.length,
      checkedCount: checkedPlaceIds.length,
      isCompleted: Boolean(progress?.completedAt),
      rewardGranted: Boolean(progress?.rewardGrantedAt),
      reward: progress?.rewardResult || null
    };
  });

  const responseJSON = {
    success: true,
    total: items.length,
    missions: items
  };

  console.log("Mock Response JSON:");
  console.log(JSON.stringify(responseJSON, null, 2));

  await mongoose.disconnect();
};

run().catch(console.error);
