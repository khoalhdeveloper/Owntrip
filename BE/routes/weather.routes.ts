import { Router } from "express";
import { getWeatherForecast } from "../controllers/weather.controller";

const router = Router();

// GET /api/weather/forecast
router.get("/forecast", getWeatherForecast);

module.exports = router;
