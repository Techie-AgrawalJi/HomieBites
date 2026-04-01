import { Router } from 'express';
import { getMealServices, getMealService, createMealService, deleteMealService, getFeaturedMeal, getProviderMealServices } from '../controllers/mealController';
import { protect, requireRole } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

router.get('/', getMealServices);
router.get('/featured', getFeaturedMeal);
router.get('/provider/:providerId', protect, requireRole('provider', 'superadmin'), getProviderMealServices);
router.get('/:id', getMealService);
router.post('/', protect, requireRole('provider'), upload.array('photos', 10), createMealService);
router.delete('/:id', protect, requireRole('provider', 'superadmin'), deleteMealService);

export default router;
