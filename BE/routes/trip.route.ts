import { Router } from "express";
import {
	createTrip,
	deleteTripById,
	getProvinceImageCatalog,
	getTripDestinations,
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
router.get("/:tripId/destinations", getTripDestinations);
router.patch("/:tripId", verifyToken, updateTrip);
router.patch("/:tripId/publish", verifyToken, updateTripPublishStatus);
router.delete("/:tripId", verifyToken, deleteTripById);
router.get("/:tripId", getTripDetail);


module.exports = router;