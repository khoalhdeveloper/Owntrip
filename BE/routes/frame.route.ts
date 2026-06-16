import { Router } from "express";
import {
  getFrames,
  getMyUnlockedFrames,
  getAllFramesAdmin,
  createFrame,
  updateFrame,
  deleteFrame,
  toggleFrameActive,
  reorderFrames
} from "../controllers/frame.controller";
import { verifyToken, authorizeRole } from "../middlewares/auth.middleware";
import { uploadFrame } from "../middlewares/upload.middleware";

const router = Router();

// Public frame catalog for existing clients.
router.get("/", getFrames);

// Frames the current user can apply in check-in/photo booth camera.
router.get("/my-unlocked", verifyToken, getMyUnlockedFrames);

// Admin routes. Static routes must be declared before /:id.
router.get("/admin", verifyToken, authorizeRole("admin"), getAllFramesAdmin);
router.patch("/reorder", verifyToken, authorizeRole("admin"), reorderFrames);

router.post(
  "/",
  verifyToken,
  authorizeRole("admin"),
  uploadFrame.single("image"),
  createFrame
);

router.put(
  "/:id",
  verifyToken,
  authorizeRole("admin"),
  uploadFrame.single("image"),
  updateFrame
);

router.delete("/:id", verifyToken, authorizeRole("admin"), deleteFrame);
router.patch("/:id/toggle", verifyToken, authorizeRole("admin"), toggleFrameActive);

module.exports = router;
