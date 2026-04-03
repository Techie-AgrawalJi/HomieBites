import { Router } from 'express';
import {
  submitListingRequest,
  getProviderListingRequests,
  editListingRequest,
  deleteRejectedListingRequest,
} from '../controllers/listingRequestController';
import { protect, requireRole } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

router.use(protect, requireRole('provider'));

router.get('/provider', getProviderListingRequests);
router.post('/submit', upload.array('photos', 10), submitListingRequest);
router.patch('/:id/edit', upload.array('photos', 10), editListingRequest);
router.delete('/:id', deleteRejectedListingRequest);

export default router;