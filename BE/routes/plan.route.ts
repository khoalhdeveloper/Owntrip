import { Router } from "express";
import { addPlaceToDay, deletePlaceFromDay } from "../controllers/plan.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/day/:dayId/place", verifyToken, addPlaceToDay);
router.delete("/day/:dayId/place/:planPlaceId", verifyToken, deletePlaceFromDay);

module.exports = router;