import { Request, Response } from "express";
import PlanPlace from "../models/planPlace.model";

export const addPlaceToDay = async (req: Request, res: Response) => {

  try {

    const { dayId } = req.params;

    const {
      placeId,
      name,
      address,
      latitude,
      longitude,
      rating,
      photo,
      mapUrl
    } = req.body;

    const count = await PlanPlace.countDocuments({ dayId });

    const place = await PlanPlace.create({

      dayId,

      placeId,
      name,
      address,

      latitude,
      longitude,

      rating,
      photo,

      mapUrl,

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

export const deletePlaceFromDay = async (req: Request, res: Response) => {

  try {

    const { dayId, planPlaceId } = req.params;

    const place = await PlanPlace.findOne({ _id: planPlaceId, dayId });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Place not found in this day"
      });
    }

    const deletedOrder = typeof place.order === "number" ? place.order : 0;

    await PlanPlace.deleteOne({ _id: planPlaceId, dayId });

    if (deletedOrder > 0) {
      await PlanPlace.updateMany(
        { dayId, order: { $gt: deletedOrder } },
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