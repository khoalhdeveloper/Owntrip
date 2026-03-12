import { Response } from "express";
import Trip from "../models/trip.model";
import PlanDay from "../models/planDay.model";
import PlanPlace from "../models/planPlace.model";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createTrip = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.user?.userId;

    const { title, destination, startDate, endDate, description } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays =
      Math.ceil(
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const trip = await Trip.create({
      userId,
      title,
      destination,
      startDate,
      endDate,
      totalDays,
      description
    });

    const days = [];

    for (let i = 0; i < totalDays; i++) {

      const date = new Date(start);
      date.setDate(start.getDate() + i);

      days.push({
        tripId: trip._id,
        dayNumber: i + 1,
        date
      });

    }

    await PlanDay.insertMany(days);

    res.json({
      success: true,
      trip
    });

  } catch (error) {
    console.error("Create trip error:", error);
    res.status(500).json({
      success: false,
      message: "Create trip failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });

  }

};




export const getTripDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found"
      });
    }

    const days = await PlanDay.find({ tripId }).sort({ dayNumber: 1 });

    const result = [];

    for (const day of days) {
      const places = await PlanPlace.find({ dayId: day._id }).sort({
        order: 1,
      });

      result.push({
        day: day.dayNumber,
        date: day.date,
        places,
      });
    }

    res.json({
      success: true,
      trip,
      days: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Get trip detail failed",
    });
  }
};

export const getMyTrips = async (req: AuthRequest, res: Response) => {
  try {

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const trips = await Trip.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: trips.length,
      trips
    });

  } catch (error) {

    console.error("Get my trips error:", error);

    res.status(500).json({
      success: false,
      message: "Get trips failed"
    });

  }
};