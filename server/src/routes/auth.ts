import { Router } from 'express';
import { signup, providerSignup, login, logout, getMe, getSavedListings, forgotPassword, resetPassword, updateProviderPaymentSettings } from '../controllers/authController';
import { protect, requireRole } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

router.post('/signup', signup);
router.post('/provider-signup', upload.array('documents', 5), providerSignup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/saved-listings', protect, getSavedListings);
router.patch('/provider/payment-settings', protect, requireRole('provider'), updateProviderPaymentSettings);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
