import { Router } from 'express';
import { getStats, getProviderApplications, getAllProviders, updateProviderStatus, getAllListings, toggleFeatured, getAllUsers } from '../controllers/adminController';
import { getAdminListingRequests, approveListing, rejectListing, requestRevisions } from '../controllers/listingRequestController';
import { protect, requireRole } from '../middleware/auth';

const router = Router();

router.use(protect, requireRole('superadmin'));

router.get('/stats', getStats);
router.get('/providers/applications', getProviderApplications);
router.get('/providers', getAllProviders);
router.patch('/providers/:id/status', updateProviderStatus);
router.get('/listings', getAllListings);
router.patch('/listings/:type/:id/featured', toggleFeatured);
router.get('/users', getAllUsers);

// Listing request routes
router.get('/listing-requests', getAdminListingRequests);
router.patch('/listing-requests/:id/approve', approveListing);
router.patch('/listing-requests/:id/reject', rejectListing);
router.patch('/listing-requests/:id/revisions', requestRevisions);

export default router;
