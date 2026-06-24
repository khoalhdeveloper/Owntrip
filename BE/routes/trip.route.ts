import { Router } from "express";
import {
	createTrip,
	deleteTripById,
	getProvinceImageCatalog,
	getTripDestinations,
	getOfflineTripPackage,
	getMyTrips,
	getPublishedTrips,
	getTripDetail,
	updateTrip,
	updateTripPublishStatus,
	getMarketplaceTrips,
	getTripPreview,
	publishToMarketplace,
	createPaymentUrl,
  handlePaymentWebhook,
  renderSandboxPayment,
	getTripSalesStats,
	submitItineraryReview,
	getMyItineraryReview,
	deleteItineraryReview
} from "../controllers/trip.controller";
import {
	getTripChecklist,
	updateTripChecklist
} from "../controllers/tripChecklist.controller";
import {
	createTripExpense,
	deleteTripExpense,
	getTripExpenses,
	updateTripExpense
} from "../controllers/tripExpense.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, createTrip);
router.get("/my", verifyToken, getMyTrips);
router.get("/provinces/images", getProvinceImageCatalog);
router.get("/published", getPublishedTrips);
router.get("/marketplace", getMarketplaceTrips);
router.get("/marketplace/:tripId/preview", getTripPreview);
router.post("/marketplace/:tripId/purchase", verifyToken, createPaymentUrl);
router.get("/payment-sandbox/:orderCode", renderSandboxPayment);
router.post("/payment-webhook", handlePaymentWebhook);
router.post("/:tripId/review", verifyToken, submitItineraryReview);
router.get("/:tripId/my-review", verifyToken, getMyItineraryReview);
router.delete("/:tripId/review", verifyToken, deleteItineraryReview);
router.get("/:tripId/offline-package", verifyToken, getOfflineTripPackage);
router.get("/:tripId/checklist", verifyToken, getTripChecklist);
router.put("/:tripId/checklist", verifyToken, updateTripChecklist);
router.get("/:tripId/expenses", verifyToken, getTripExpenses);
router.post("/:tripId/expenses", verifyToken, createTripExpense);
router.patch("/:tripId/expenses/:expenseId", verifyToken, updateTripExpense);
router.delete("/:tripId/expenses/:expenseId", verifyToken, deleteTripExpense);
router.patch("/:tripId/marketplace", verifyToken, publishToMarketplace);
router.get("/:tripId/destinations", getTripDestinations);
router.get("/:tripId/sales-stats", verifyToken, getTripSalesStats);
router.patch("/:tripId", verifyToken, updateTrip);
router.patch("/:tripId/publish", verifyToken, updateTripPublishStatus);
router.delete("/:tripId", verifyToken, deleteTripById);
router.get("/:tripId", getTripDetail);

module.exports = router;
