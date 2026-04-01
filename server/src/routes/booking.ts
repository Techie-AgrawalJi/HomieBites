import { Router } from 'express';
import { createBooking, getUserBookings, getProviderBookings, updateBookingStatus, getAllBookings } from '../controllers/bookingController';
import { protect, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', protect, createBooking);
router.get('/my', protect, getUserBookings);
router.get('/provider/:providerId', protect, requireRole('provider'), getProviderBookings);
router.patch('/:id/status', protect, requireRole('provider', 'superadmin'), updateBookingStatus);
router.get('/all', protect, requireRole('superadmin'), getAllBookings);

export default router;
