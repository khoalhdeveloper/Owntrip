"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantCheckinFrameReward = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const grantCheckinFrameReward = async ({ UserModel = user_model_1.default, userId, frameId }) => {
    const result = await UserModel.updateOne({ userId }, { $addToSet: { unlockedCheckinFrameIds: frameId } });
    return {
        type: "checkin_frame",
        frameId,
        granted: (result.modifiedCount ?? result.nModified ?? 0) > 0
    };
};
exports.grantCheckinFrameReward = grantCheckinFrameReward;
