import { Router } from 'express';
import { getPGListings, getPGListing, createPGListing, updatePGListing, deletePGListing, saveListing, getFeaturedPG, getProviderPGListings } from '../controllers/pgController';
import { protect, requireRole } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

router.get('/', getPGListings);
router.get('/featured', getFeaturedPG);
router.get('/provider/:providerId', protect, requireRole('provider', 'superadmin'), getProviderPGListings);
router.get('/:id', getPGListing);
router.post('/', protect, requireRole('provider'), upload.array('photos', 10), createPGListing);
router.put('/:id', protect, requireRole('provider', 'superadmin'), updatePGListing);
router.delete('/:id', protect, requireRole('provider', 'superadmin'), deletePGListing);
router.post('/:id/save', protect, saveListing);

export default router;
