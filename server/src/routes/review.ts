import { Router } from 'express';
import { getReviews, createOrUpdateReview } from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', getReviews);
router.post('/', protect, createOrUpdateReview);

export default router;
