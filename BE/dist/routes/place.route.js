"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const place_controller_1 = require("../controllers/place.controller");
const router = (0, express_1.Router)();
/**
 * Tìm kiếm địa điểm theo từ khóa (autocomplete)
 * GET /api/places/search?q=cafe dalat
 */
router.get("/search", place_controller_1.searchPlace);
/**
 * Tìm kiếm địa điểm gần vị trí
 * GET /api/places/nearby?lat=10.762622&lng=106.660172&radius=5000&type=lodging,restaurant
 */
router.get("/nearby", place_controller_1.searchNearby);
/**
 * Tìm kiếm địa điểm theo text (full search)
 * GET /api/places/text?q=cafe dalat&lat=11.94&lng=108.44&radius=5000
 */
router.get("/text", place_controller_1.searchText);
module.exports = router;
