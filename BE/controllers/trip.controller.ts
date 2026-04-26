import { Request, Response } from "express";
import Trip from "../models/trip.model";
import PlanDay from "../models/planDay.model";
import PlanPlace from "../models/planPlace.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  findProvinceImageByDestination,
  getProvinceImages,
  normalizeText
} from "../utils/provinceImages";

import Notification from "../models/notification.model";

export const createTrip = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.user?.userId;

    const { title, destination, startDate, endDate, description, isPublished } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays =
      Math.ceil(
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const matchedProvince = findProvinceImageByDestination(destination);

    const trip = await Trip.create({
      userId,
      title,
      destination,
      province: matchedProvince?.province,
      provinceImage: matchedProvince?.imageUrl,
      startDate,
      endDate,
      totalDays,
      description,
      isPublished: Boolean(isPublished)
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

    // Tạo notification cho user
    await Notification.create({
      userId,
      title: "Tạo chuyến đi thành công",
      message: `Chuyến đi '${title}' đến ${destination} đã được tạo thành công!`,
    });

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
        dayId: day._id,
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

export const getTripDestinations = async (req: AuthRequest, res: Response) => {
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
    const dayMap = new Map<string, { dayId: string; day: number; date: Date }>();

    for (const day of days) {
      dayMap.set(String(day._id), {
        dayId: String(day._id),
        day: day.dayNumber,
        date: day.date
      });
    }

    const dayIds = days.map((day) => day._id);
    const places = dayIds.length > 0
      ? await PlanPlace.find({ dayId: { $in: dayIds } }).sort({ order: 1, createdAt: 1 })
      : [];

    const destinations = places.map((place) => {
      const dayInfo = dayMap.get(String(place.dayId));
      return {
        dayId: String(place.dayId),
        day: dayInfo?.day,
        date: dayInfo?.date,
        place
      };
    });

    return res.json({
      success: true,
      trip: {
        _id: trip._id,
        title: trip.title,
        destination: trip.destination
      },
      totalDestinations: destinations.length,
      destinations
    });
  } catch (error) {
    console.error("Get trip destinations error:", error);
    return res.status(500).json({
      success: false,
      message: "Get trip destinations failed"
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

export const getProvinceImageCatalog = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const normalizedQ = q ? normalizeText(String(q)) : "";

    const provinces = getProvinceImages().filter((item) => {
      if (!normalizedQ) {
        return true;
      }

      return (
        normalizeText(item.province).includes(normalizedQ) ||
        item.keywords.some((keyword) => keyword.includes(normalizedQ))
      );
    });

    return res.json({
      success: true,
      total: provinces.length,
      provinces
    });
  } catch (error) {
    console.error("Get province images error:", error);
    return res.status(500).json({
      success: false,
      message: "Get province images failed"
    });
  }
};

export const updateTrip = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { tripId } = req.params;
    const { title, destination, startDate, endDate, description, isPublished } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const trip = await Trip.findOne({ _id: tripId, userId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or you do not have permission"
      });
    }

    if (title !== undefined) {
      trip.title = title;
    }

    if (description !== undefined) {
      trip.description = description;
    }

    if (typeof isPublished === "boolean") {
      trip.isPublished = isPublished;
    }

    if (destination !== undefined) {
      trip.destination = destination;
      const matchedProvince = findProvinceImageByDestination(destination);
      trip.province = matchedProvince?.province;
      trip.provinceImage = matchedProvince?.imageUrl;
    }

    if (req.body.accommodation !== undefined) {
      trip.accommodation = req.body.accommodation;
      // Đảm bảo mongoose nhận biết trường này đã thay đổi
      trip.markModified('accommodation');
    }

    const nextStartDate = startDate ? new Date(startDate) : new Date(trip.startDate);
    const nextEndDate = endDate ? new Date(endDate) : new Date(trip.endDate);

    if (Number.isNaN(nextStartDate.getTime()) || Number.isNaN(nextEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate or endDate"
      });
    }

    if (nextEndDate.getTime() < nextStartDate.getTime()) {
      return res.status(400).json({
        success: false,
        message: "endDate must be greater than or equal to startDate"
      });
    }

    const nextTotalDays =
      Math.ceil(
        (nextEndDate.getTime() - nextStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const currentStartMs = new Date(trip.startDate).setHours(0, 0, 0, 0);
    const currentEndMs = new Date(trip.endDate).setHours(0, 0, 0, 0);
    const nextStartMs = new Date(nextStartDate).setHours(0, 0, 0, 0);
    const nextEndMs = new Date(nextEndDate).setHours(0, 0, 0, 0);

    const dateRangeChanged =
      currentStartMs !== nextStartMs ||
      currentEndMs !== nextEndMs ||
      trip.totalDays !== nextTotalDays;

    trip.startDate = nextStartDate;
    trip.endDate = nextEndDate;
    trip.totalDays = nextTotalDays;

    await trip.save();

    if (dateRangeChanged) {
      const existingDays = await PlanDay.find({ tripId }).sort({ dayNumber: 1 });
      const existingDayByNumber = new Map<number, any>();

      for (const day of existingDays) {
        if (!existingDayByNumber.has(day.dayNumber)) {
          existingDayByNumber.set(day.dayNumber, day);
        }
      }

      for (let dayNumber = 1; dayNumber <= nextTotalDays; dayNumber++) {
        const nextDate = new Date(nextStartDate);
        nextDate.setDate(nextStartDate.getDate() + (dayNumber - 1));

        const existingDay = existingDayByNumber.get(dayNumber);

        if (!existingDay) {
          await PlanDay.create({
            tripId,
            dayNumber,
            date: nextDate
          });
          continue;
        }

        existingDay.date = nextDate;
        await existingDay.save();
      }

      const redundantDays = existingDays.filter((day) => day.dayNumber > nextTotalDays);
      const redundantDayIds = redundantDays.map((day) => day._id);

      if (redundantDayIds.length > 0) {
        await PlanPlace.deleteMany({ dayId: { $in: redundantDayIds } });
        await PlanDay.deleteMany({ _id: { $in: redundantDayIds } });
      }
    }

    const days = await PlanDay.find({ tripId }).sort({ dayNumber: 1 });
    const result = [];

    for (const day of days) {
      const places = await PlanPlace.find({ dayId: day._id }).sort({ order: 1 });
      result.push({
        dayId: day._id,
        day: day.dayNumber,
        date: day.date,
        places
      });
    }

    return res.json({
      success: true,
      message: "Trip updated successfully",
      trip,
      days: result
    });
  } catch (error) {
    console.error("Update trip error:", error);
    return res.status(500).json({
      success: false,
      message: "Update trip failed"
    });
  }
};

export const getPublishedTrips = async (req: Request, res: Response) => {
  try {
    const { limit, page, destination } = req.query;

    const parsedLimit = Number(limit);
    const parsedPage = Number(page);
    const pageSize = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 50)
      : 20;
    const currentPage = Number.isFinite(parsedPage)
      ? Math.max(Math.floor(parsedPage), 1)
      : 1;

    const filters: any = { isPublished: true };

    if (destination) {
      filters.destination = { $regex: destination as string, $options: "i" };
    }

    const [trips, total] = await Promise.all([
      Trip.find(filters)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Trip.countDocuments(filters)
    ]);

    return res.json({
      success: true,
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      trips
    });
  } catch (error) {
    console.error("Get published trips error:", error);
    return res.status(500).json({
      success: false,
      message: "Get published trips failed"
    });
  }
};

export const updateTripPublishStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { tripId } = req.params;
    const { isPublished } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPublished must be boolean"
      });
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId },
      { isPublished },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or you do not have permission"
      });
    }

    return res.json({
      success: true,
      message: isPublished ? "Trip published successfully" : "Trip unpublished successfully",
      trip
    });
  } catch (error) {
    console.error("Update trip publish status error:", error);
    return res.status(500).json({
      success: false,
      message: "Update trip publish status failed"
    });
  }
 

};

export const deleteTripById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { tripId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const trip = await Trip.findOne({ _id: tripId, userId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or you do not have permission"
      });
    }

    const planDays = await PlanDay.find({ tripId }).select("_id");
    const dayIds = planDays.map((day) => day._id);

    if (dayIds.length > 0) {
      await PlanPlace.deleteMany({ dayId: { $in: dayIds } });
    }

    await PlanDay.deleteMany({ tripId });
    await Trip.deleteOne({ _id: tripId, userId });

    return res.json({
      success: true,
      message: "Trip deleted successfully"
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    return res.status(500).json({
      success: false,
      message: "Delete trip failed"
    });
  }
};
