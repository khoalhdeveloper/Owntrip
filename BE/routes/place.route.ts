import { Router } from "express";
import { getPlacePhoto, searchPlace, searchNearby, searchText, getPlaceChildren, getTopAddedPlaces, togglePlaceCheckin } from "../controllers/place.controller";
import { verifyToken, authorizeRole } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Lấy các địa điểm con (Child ID) của một địa điểm cha (Goong API V2)
 * GET /api/places/children?parent_id=...&has_deprecated_administrative_unit=false
 */
router.get("/children", getPlaceChildren);

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

/**
 * Tìm kiếm địa điểm theo cụm địa chỉ
 * GET /api/places/address?address=Kim Bồng Tây, Hội An, Đà Nẵng
 */
router.get("/address", searchText);

/**
 * Proxy ảnh địa điểm qua backend (không lộ RapidAPI key)
 * GET /api/places/photo?name=places/.../photos/...&maxHeightPx=400
 */
router.get("/photo", getPlacePhoto);

router.get("/gettopplaces", getTopAddedPlaces);

// Admin endpoints to toggle place check-in capability
router.patch("/:id/toggle-checkin", verifyToken, authorizeRole("admin"), togglePlaceCheckin);
router.put("/:id", verifyToken, authorizeRole("admin"), togglePlaceCheckin);

module.exports = router;