import { Router } from "express";
import { addPlaceToDay } from "../controllers/plan.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/day/:dayId/place", verifyToken, addPlaceToDay);

module.exports = router;