import User from "../models/user.model";

type UserModelLike = {
  updateOne: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ) => Promise<{ modifiedCount?: number; nModified?: number }>;
};

type GrantCheckinFrameRewardParams = {
  UserModel?: UserModelLike;
  userId: string;
  frameId: string;
};

export type CheckinFrameRewardResult = {
  type: "checkin_frame";
  frameId: string;
  granted: boolean;
};

export const grantCheckinFrameReward = async ({
  UserModel = User,
  userId,
  frameId
}: GrantCheckinFrameRewardParams): Promise<CheckinFrameRewardResult> => {
  const result = await UserModel.updateOne(
    { userId },
    { $addToSet: { unlockedCheckinFrameIds: frameId } }
  );

  return {
    type: "checkin_frame",
    frameId,
    granted: (result.modifiedCount ?? result.nModified ?? 0) > 0
  };
};
