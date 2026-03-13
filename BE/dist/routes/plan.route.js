"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plan_controller_1 = require("../controllers/plan.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/day/:dayId/place", auth_middleware_1.verifyToken, plan_controller_1.addPlaceToDay);
module.exports = router;
