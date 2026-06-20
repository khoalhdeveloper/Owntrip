import express from 'express';
import { rearrangeItinerary, autoGenerateTrip, scoreItinerary } from '../controllers/ai.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { aiRateLimit } from '../middlewares/aiRateLimit.middleware';

const router = express.Router();

router.post('/rearrange', verifyToken, aiRateLimit, rearrangeItinerary);
router.post('/auto-generate', verifyToken, aiRateLimit, autoGenerateTrip);
router.post('/itinerary-score', verifyToken, aiRateLimit, scoreItinerary);

module.exports = router;
