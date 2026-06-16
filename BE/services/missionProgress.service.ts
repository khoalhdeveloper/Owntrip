import Mission from "../models/mission.model";
import UserMissionProgress from "../models/userMissionProgress.model";
import User from "../models/user.model";
import { IMission } from "../interfaces/mission.interface";
import { grantCheckinFrameReward } from "./checkinFrameReward.service";

type QueryWithSort<T> = {
  sort: (sort: Record<string, 1 | -1>) => Promise<T[]>;
};

type MissionModelLike = {
  find: (filter: Record<string, unknown>) => QueryWithSort<any>;
  findById?: (id: string) => Promise<any>;
};

type ProgressModelLike = {
  findOne: (filter: Record<string, unknown>) => Promise<any>;
  create: (data: Record<string, unknown>) => Promise<any>;
  find?: (filter: Record<string, unknown>) => Promise<any[]>;
};

type GrantRewardParams = {
  userId: string;
  mission: IMission | any;
};

type RecordMissionCheckinParams = {
  userId: string;
  placeId: string;
  MissionModel?: MissionModelLike;
  ProgressModel?: ProgressModelLike;
  grantReward?: (params: GrantRewardParams) => Promise<Record<string, unknown>>;
};

const now = () => new Date();

const activeMissionFilterForPlace = (placeId: string) => {
  const currentDate = now();

  return {
    isActive: true,
    requiredPlaceIds: placeId,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: currentDate } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: currentDate } }] }
    ]
  };
};

const isMissionCompleted = (mission: IMission | any, checkedPlaceIds: string[]) => {
  const checked = new Set(checkedPlaceIds);
  return mission.requiredPlaceIds.every((requiredPlaceId: string) => checked.has(requiredPlaceId));
};

export const grantMissionReward = async ({
  userId,
  mission
}: GrantRewardParams): Promise<Record<string, unknown>> => {
  const reward = mission.reward;

  if (reward.type === "checkin_frame") {
    if (!reward.frameId) {
      throw new Error("Mission reward frameId is required");
    }

    return grantCheckinFrameReward({
      userId,
      frameId: String(reward.frameId)
    });
  }

  if (reward.type === "points") {
    const pointsAmount = Number(reward.pointsAmount || 0);
    if (pointsAmount > 0) {
      await User.updateOne({ userId }, { $inc: { points: pointsAmount } });
    }

    return {
      type: "points",
      pointsAmount,
      granted: pointsAmount > 0
    };
  }

  return {
    type: reward.type,
    souvenirId: reward.souvenirId,
    granted: true
  };
};

export const recordMissionCheckin = async ({
  userId,
  placeId,
  MissionModel = Mission,
  ProgressModel = UserMissionProgress,
  grantReward = grantMissionReward
}: RecordMissionCheckinParams) => {
  const missions = await MissionModel.find(activeMissionFilterForPlace(placeId)).sort({ order: 1 });
  const updatedProgress: any[] = [];
  const rewards: Record<string, unknown>[] = [];

  for (const mission of missions) {
    let progress = await ProgressModel.findOne({
      userId,
      missionId: mission._id
    });

    if (!progress) {
      progress = await ProgressModel.create({
        userId,
        missionId: mission._id,
        checkedPlaceIds: []
      });
    }

    if (!progress.checkedPlaceIds.includes(placeId)) {
      progress.checkedPlaceIds.push(placeId);
    }

    if (!progress.completedAt && isMissionCompleted(mission, progress.checkedPlaceIds)) {
      progress.completedAt = now();
    }

    if (progress.completedAt && !progress.rewardGrantedAt) {
      const rewardResult = await grantReward({ userId, mission });
      progress.rewardGrantedAt = now();
      progress.rewardClaimedAt = progress.rewardClaimedAt || progress.rewardGrantedAt;
      progress.rewardResult = rewardResult;
      rewards.push(rewardResult);
    }

    await progress.save();
    updatedProgress.push(progress);
  }

  return {
    missionProgress: updatedProgress,
    rewards
  };
};

export const claimMissionReward = async ({
  userId,
  missionId,
  MissionModel = Mission,
  ProgressModel = UserMissionProgress,
  grantReward = grantMissionReward
}: {
  userId: string;
  missionId: string;
  MissionModel?: MissionModelLike;
  ProgressModel?: ProgressModelLike;
  grantReward?: (params: GrantRewardParams) => Promise<Record<string, unknown>>;
}) => {
  if (!MissionModel.findById) {
    throw new Error("MissionModel.findById is required");
  }

  const mission = await MissionModel.findById(missionId);
  if (!mission || !mission.isActive) {
    return { status: "not_found" as const };
  }

  const progress = await ProgressModel.findOne({ userId, missionId: mission._id });
  if (!progress || !progress.completedAt) {
    return { status: "not_completed" as const };
  }

  if (progress.rewardGrantedAt) {
    return {
      status: "already_granted" as const,
      progress,
      reward: progress.rewardResult
    };
  }

  const reward = await grantReward({ userId, mission });
  progress.rewardGrantedAt = now();
  progress.rewardClaimedAt = progress.rewardGrantedAt;
  progress.rewardResult = reward;
  await progress.save();

  return {
    status: "granted" as const,
    progress,
    reward
  };
};
