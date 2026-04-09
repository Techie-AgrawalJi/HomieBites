import { Router } from 'express';
import { createOrder, verifyPayment, createMealOrder, confirmMockMealPayment } from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/create-order', protect, createOrder);
router.post('/create-meal-order', protect, createMealOrder);
router.post('/mock-confirm', protect, confirmMockMealPayment);
router.post('/verify', protect, verifyPayment);

export default router;
