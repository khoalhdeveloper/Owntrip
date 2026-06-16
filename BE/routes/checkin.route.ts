import { Router } from "express";
import {
  createCheckinMemory,
  getNearbyCheckinPlacesController,
  verifyCheckinLocation,
  getMyCheckins,
  getMyCheckedInPlaces,
  toggleCheckinFavorite,
  deleteCheckin
} from "../controllers/checkin.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkinVerifyRateLimit } from "../middlewares/checkinRateLimit.middleware";

const router = Router();

router.post("/", verifyToken, createCheckinMemory);
router.get("/nearby", verifyToken, getNearbyCheckinPlacesController);
router.post("/verify", verifyToken, checkinVerifyRateLimit, verifyCheckinLocation);
router.get("/my", verifyToken, getMyCheckins);
router.get("/my/places", verifyToken, getMyCheckedInPlaces);
router.patch("/:id/favorite", verifyToken, toggleCheckinFavorite);
router.delete("/:id", verifyToken, deleteCheckin);

module.exports = router;
