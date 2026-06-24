"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const frame_controller_1 = require("../controllers/frame.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Public frame catalog for existing clients.
router.get("/", frame_controller_1.getFrames);
// Frames the current user can apply in check-in/photo booth camera.
router.get("/my-unlocked", auth_middleware_1.verifyToken, frame_controller_1.getMyUnlockedFrames);
// Admin routes. Static routes must be declared before /:id.
router.get("/admin", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), frame_controller_1.getAllFramesAdmin);
router.patch("/reorder", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), frame_controller_1.reorderFrames);
router.post("/", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), upload_middleware_1.uploadFrame.single("image"), frame_controller_1.createFrame);
router.put("/:id", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), upload_middleware_1.uploadFrame.single("image"), frame_controller_1.updateFrame);
router.delete("/:id", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), frame_controller_1.deleteFrame);
router.patch("/:id/toggle", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), frame_controller_1.toggleFrameActive);
module.exports = router;
