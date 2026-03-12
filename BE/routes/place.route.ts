import { Router } from "express";
import { searchPlace, searchNearby, searchText } from "../controllers/place.controller";

const router = Router();

/**
 * Tìm kiếm địa điểm theo từ khóa (autocomplete)
 * GET /api/places/search?q=cafe dalat
 */
router.get("/search", searchPlace);

/**
 * Tìm kiếm địa điểm gần vị trí
 * GET /api/places/nearby?lat=10.762622&lng=106.660172&radius=5000&type=lodging,restaurant
 */
router.get("/nearby", searchNearby);

/**
 * Tìm kiếm địa điểm theo text (full search)
 * GET /api/places/text?q=cafe dalat&lat=11.94&lng=108.44&radius=5000
 */
router.get("/text", searchText);

module.exports = router;