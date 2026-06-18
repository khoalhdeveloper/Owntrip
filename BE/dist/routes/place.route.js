"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const place_controller_1 = require("../controllers/place.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Lấy các địa điểm con (Child ID) của một địa điểm cha (Goong API V2)
 * GET /api/places/children?parent_id=...&has_deprecated_administrative_unit=false
 */
router.get("/children", place_controller_1.getPlaceChildren);
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
/**
 * Tìm kiếm địa điểm theo cụm địa chỉ
 * GET /api/places/address?address=Kim Bồng Tây, Hội An, Đà Nẵng
 */
router.get("/address", place_controller_1.searchText);
/**
 * Proxy ảnh địa điểm qua backend (không lộ RapidAPI key)
 * GET /api/places/photo?name=places/.../photos/...&maxHeightPx=400
 */
router.get("/photo", place_controller_1.getPlacePhoto);
router.get("/gettopplaces", place_controller_1.getTopAddedPlaces);
// Admin endpoints to toggle place check-in capability
router.patch("/:id/toggle-checkin", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), place_controller_1.togglePlaceCheckin);
router.put("/:id", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)("admin"), place_controller_1.togglePlaceCheckin);
module.exports = router;
