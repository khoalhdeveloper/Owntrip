"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMissionPayload = exports.MissionAdminValidationError = void 0;
const REWARD_TYPES = ["points", "souvenir", "checkin_frame"];
class MissionAdminValidationError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
exports.MissionAdminValidationError = MissionAdminValidationError;
const uniqueStrings = (values) => {
    if (!Array.isArray(values))
        return [];
    return Array.from(new Set(values
        .map((value) => String(value || "").trim())
        .filter(Boolean)));
};
const parseOptionalDate = (value) => {
    if (!value)
        return undefined;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        throw new MissionAdminValidationError("invalid_date", "startsAt or endsAt is invalid");
    }
    return date;
};
const buildMissionPayload = (input, partial = false) => {
    const payload = {};
    if (!partial || input.title !== undefined) {
        const title = String(input.title || "").trim();
        if (!title) {
            throw new MissionAdminValidationError("missing_title", "Mission title is required");
        }
        payload.title = title;
    }
    if (!partial || input.description !== undefined) {
        payload.description = String(input.description || "").trim();
    }
    if (!partial || input.imageUrl !== undefined) {
        payload.imageUrl = String(input.imageUrl || "").trim();
    }
    if (!partial || input.requiredPlaceIds !== undefined) {
        const requiredPlaceIds = uniqueStrings(input.requiredPlaceIds);
        if (requiredPlaceIds.length === 0) {
            throw new MissionAdminValidationError("missing_required_places", "Mission must include at least one required place");
        }
        payload.requiredPlaceIds = requiredPlaceIds;
    }
    if (!partial || input.reward !== undefined) {
        const reward = input.reward || {};
        const type = String(reward.type || "");
        if (!REWARD_TYPES.includes(type)) {
            throw new MissionAdminValidationError("invalid_reward_type", "Mission reward type is invalid");
        }
        const normalizedReward = { type };
        if (type === "points") {
            const pointsAmount = Number(reward.pointsAmount ?? reward.amount ?? 0);
            if (!Number.isFinite(pointsAmount) || pointsAmount <= 0) {
                throw new MissionAdminValidationError("invalid_reward_points", "points reward requires a positive pointsAmount");
            }
            normalizedReward.pointsAmount = pointsAmount;
        }
        if (type === "checkin_frame") {
            const frameId = String(reward.frameId || reward.itemId || "").trim();
            if (!frameId) {
                throw new MissionAdminValidationError("missing_reward_frame", "checkin_frame reward requires frameId");
            }
            normalizedReward.frameId = frameId;
        }
        if (type === "souvenir") {
            const souvenirId = String(reward.souvenirId || reward.itemId || "").trim();
            if (!souvenirId) {
                throw new MissionAdminValidationError("missing_reward_souvenir", "souvenir reward requires souvenirId");
            }
            normalizedReward.souvenirId = souvenirId;
        }
        if (reward.title !== undefined) {
            normalizedReward.title = String(reward.title || "").trim();
        }
        if (reward.description !== undefined) {
            normalizedReward.description = String(reward.description || "").trim();
        }
        payload.reward = normalizedReward;
    }
    if (!partial || input.isActive !== undefined) {
        payload.isActive = input.isActive === undefined ? true : Boolean(input.isActive);
    }
    if (!partial || input.order !== undefined) {
        const order = Number(input.order || 0);
        payload.order = Number.isFinite(order) ? order : 0;
    }
    if (!partial || input.startsAt !== undefined) {
        payload.startsAt = parseOptionalDate(input.startsAt);
    }
    if (!partial || input.endsAt !== undefined) {
        payload.endsAt = parseOptionalDate(input.endsAt);
    }
    return payload;
};
exports.buildMissionPayload = buildMissionPayload;
