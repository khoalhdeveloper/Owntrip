import { Router } from "express";
import {
  createMemory,
  deleteMemory,
  getMyMemories,
  getTripMemories
} from "../controllers/memory.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, createMemory);
router.get("/my", verifyToken, getMyMemories);
router.get("/trip/:tripId", verifyToken, getTripMemories);
router.delete("/:id", verifyToken, deleteMemory);

module.exports = router;
