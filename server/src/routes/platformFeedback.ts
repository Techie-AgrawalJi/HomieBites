import { Router } from 'express';
import { createPlatformFeedback, getMyPlatformFeedback } from '../controllers/platformFeedbackController';
import { protect, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', protect, requireRole('user', 'provider'), createPlatformFeedback);
router.get('/mine', protect, requireRole('user', 'provider'), getMyPlatformFeedback);

export default router;
