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