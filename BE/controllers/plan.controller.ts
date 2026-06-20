import { Response } from "express";
import mongoose from "mongoose";
import PlanPlace from "../models/planPlace.model";
import Place from "../models/place.model";
import PlanDay from "../models/planDay.model";
import Trip from "../models/trip.model";
import { AuthRequest } from "../middlewares/auth.middleware";

const forbiddenItineraryMessage = "You do not have permission to edit this itinerary";

async function assertDayOwner(dayId: string, userId: string) {
  const day = await PlanDay.findById(dayId);
  if (!day) {
    return null;
  }

  const trip = await Trip.findOne({ _id: day.tripId, userId });
  if (!trip) {
    return null;
  }

  return { day, trip };
}

const getRequesterId = (req: AuthRequest) => req.user?.userId;

export const addPlaceToDay = async (req: AuthRequest, res: Response) => {

  try {

    const dayId = String(req.params.dayId);
    const userId = getRequesterId(req);

    if (!userId || !(await assertDayOwner(dayId, userId))) {
      return res.status(403).json({
        success: false,
        message: forbiddenItineraryMessage
      });
    }

    const {
      placeId,
      name,
      address,
      latitude,
      longitude,
      rating,
      photo,
      mapUrl,
      timeOfDay
    } = req.body;

    const count = await PlanPlace.countDocuments({ dayId: dayId as any });

    // Cập nhật bộ đếm độ phổ biến của địa điểm
    await Place.findOneAndUpdate(
      { placeId },
      {
        $inc: { addedCount: 1 },
        $setOnInsert: { name, address, location: { lat: latitude, lng: longitude } }
      },
      { upsert: true, new: true }
    );

    const place = await PlanPlace.create({

      dayId: dayId as any,

      placeId,
      name,
      address,

      latitude,
      longitude,

      rating,
      photo,
      mapUrl,
      timeOfDay,
      order: count + 1
    });

    res.json({
      success: true,
      place
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Add place failed"
    });

  }

};

export const reorderPlaces = async (req: AuthRequest, res: Response) => {
  try {
    const dayId = String(req.params.dayId);
    const { placeIds } = req.body; 
    const userId = getRequesterId(req);

    if (!userId || !(await assertDayOwner(dayId, userId))) {
      return res.status(403).json({
        success: false,
        message: forbiddenItineraryMessage
      });
    }

    if (!Array.isArray(placeIds)) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const updates = placeIds.map((id, index) => 
      PlanPlace.updateOne({ _id: id, dayId: dayId as any }, { order: index + 1 })
    );

    await Promise.all(updates);

    res.json({ success: true, message: "Reordered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Reorder failed" });
  }
};

export const deletePlaceFromDay = async (req: AuthRequest, res: Response) => {

  try {

    const dayId = String(req.params.dayId);
    const planPlaceId = String(req.params.planPlaceId);
    const userId = getRequesterId(req);

    if (!userId || !(await assertDayOwner(dayId, userId))) {
      return res.status(403).json({
        success: false,
        message: forbiddenItineraryMessage
      });
    }

    const place = await PlanPlace.findOne({ _id: planPlaceId as any, dayId: dayId as any });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Place not found in this day"
      });
    }

    const deletedOrder = typeof place.order === "number" ? place.order : 0;

    await PlanPlace.deleteOne({ _id: planPlaceId as any, dayId: dayId as any });

    if (deletedOrder > 0) {
      await PlanPlace.updateMany(
        { dayId: dayId as any, order: { $gt: deletedOrder } },
        { $inc: { order: -1 } }
      );
    }

    return res.json({
      success: true,
      message: "Delete place successfully",
      deletedPlaceId: planPlaceId
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Delete place failed"
    });

  }

};

export const reorderPlacesInDay = async (req: AuthRequest, res: Response) => {
  try {
    const { dayId, orderedPlaceIds, orderedPlanPlaceIds, placeIds } = req.body;

    const targetDayId = dayId ?? req.body.dayId;
    const orderedIds = orderedPlaceIds ?? orderedPlanPlaceIds ?? placeIds;

    if (!targetDayId) {
      return res.status(400).json({
        success: false,
        message: "dayId is required"
      });
    }

    const userId = getRequesterId(req);

    if (!userId || !(await assertDayOwner(String(targetDayId), userId))) {
      return res.status(403).json({
        success: false,
        message: forbiddenItineraryMessage
      });
    }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderedPlaceIds must be a non-empty array"
      });
    }

    const normalizedIds = orderedIds.map((value) => String(value));
    const uniqueIds = new Set(normalizedIds);

    if (uniqueIds.size !== normalizedIds.length) {
      return res.status(400).json({
        success: false,
        message: "orderedPlaceIds contains duplicate values"
      });
    }

    const places = await PlanPlace.find({ dayId: targetDayId });

    const placeByDocId = new Map<string, (typeof places)[number]>();
    const placeByPlaceId = new Map<string, (typeof places)[number]>();

    for (const place of places) {
      placeByDocId.set(String(place._id), place);
      placeByPlaceId.set(String(place.placeId), place);
    }

    const orderedPlaces = normalizedIds.map((id) => {
      return placeByDocId.get(id) ?? placeByPlaceId.get(id) ?? null;
    });

    const missingIds = normalizedIds.filter((id, index) => !orderedPlaces[index]);

    if (missingIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some places in orderedPlaceIds do not belong to this day",
        missingIds
      });
    }

    if (orderedPlaces.length !== places.length) {
      return res.status(400).json({
        success: false,
        message: "orderedPlaceIds must contain all places of the day"
      });
    }

    await PlanPlace.bulkWrite(
      orderedPlaces.map((place, index) => ({
        updateOne: {
          filter: { _id: place!._id, dayId: new mongoose.Types.ObjectId(targetDayId) },
          update: { $set: { order: index + 1 } }
        }
      }))
    );

    return res.json({
      success: true,
      message: "Reorder places successfully",
      dayId: targetDayId,
      totalPlaces: orderedPlaces.length,
      orderedPlaceIds: normalizedIds
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Reorder places failed"
    });
  }
};
