import { Router } from "express";
import {
  getMissions,
  getMyMissionProgress,
  claimReward,
  getAllMissionsAdmin,
  createMissionAdmin,
  updateMissionAdmin,
  deleteMissionAdmin,
  toggleMissionActiveAdmin
} from "../controllers/mission.controller";
import { verifyToken, authorizeRole } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getMissions);
router.get("/my-progress", verifyToken, getMyMissionProgress);
router.get("/admin", verifyToken, authorizeRole("admin"), getAllMissionsAdmin);
router.post("/", verifyToken, authorizeRole("admin"), createMissionAdmin);
router.patch("/:id/toggle", verifyToken, authorizeRole("admin"), toggleMissionActiveAdmin);
router.put("/:id", verifyToken, authorizeRole("admin"), updateMissionAdmin);
router.delete("/:id", verifyToken, authorizeRole("admin"), deleteMissionAdmin);
router.post("/:id/claim-reward", verifyToken, claimReward);

module.exports = router;
