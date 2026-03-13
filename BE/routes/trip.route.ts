import { Router } from "express";
import {
	createTrip,
	getProvinceImageCatalog,
	getMyTrips,
	getPublishedTrips,
	getTripDetail,
	updateTrip,
	updateTripPublishStatus
} from "../controllers/trip.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, createTrip);
router.get("/my", verifyToken, getMyTrips);
router.get("/provinces/images", getProvinceImageCatalog);
router.get("/published", getPublishedTrips);
router.patch("/:tripId", verifyToken, updateTrip);
router.patch("/:tripId/publish", verifyToken, updateTripPublishStatus);
router.get("/:tripId", getTripDetail);


module.exports = router;