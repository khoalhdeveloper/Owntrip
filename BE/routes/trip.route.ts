import { Router } from "express";
import { createTrip, getMyTrips, getTripDetail } from "../controllers/trip.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, createTrip);
router.get("/my", verifyToken, getMyTrips);
router.get("/:tripId", verifyToken, getTripDetail);


module.exports = router;