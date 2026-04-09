import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking';
import MealService from '../models/MealService';
import { AuthRequest } from '../middleware/auth';

const hasRazorpayConfig = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const allowMockPayment = () =>
  !hasRazorpayConfig() && process.env.NODE_ENV !== 'production';

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET secrets.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const options = {
      amount: Math.round(booking.paymentAmount * 100),
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    };
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);
    booking.razorpayOrderId = order.id;
    await booking.save();
    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency }, message: 'Order created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingToken } = req.body;
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Razorpay is not configured.' });
    }
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest('hex');
    if (expectedSig !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    if (bookingToken) {
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ success: false, message: 'JWT secret is not configured.' });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(bookingToken, process.env.JWT_SECRET as string);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid or expired booking token' });
      }

      if (decoded.orderId !== razorpayOrderId) {
        return res.status(400).json({ success: false, message: 'Order mismatch for payment confirmation' });
      }

      if (String(decoded.userId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Booking token does not belong to this user' });
      }

      const existing = await Booking.findOne({
        user: req.user._id,
        razorpayPaymentId,
      });
      if (existing) {
        return res.json({ success: true, data: existing, message: 'Payment already verified' });
      }

      const booking = await Booking.create({
        user: req.user._id,
        listing: decoded.listingId,
        listingType: 'meal',
        provider: decoded.providerId,
        bookingDetails: {
          planName: decoded.planName,
          duration: decoded.duration,
          serviceTier: decoded.serviceTier,
          serviceDate: decoded.serviceDate ? new Date(decoded.serviceDate) : undefined,
          message: decoded.message || '',
        },
        paymentAmount: Number(decoded.amount) || 0,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
        paymentStatus: 'paid',
      });

      return res.json({
        success: true,
        data: booking,
        message: 'Payment verified and booking confirmed',
      });
    }

    const booking = await Booking.findByIdAndUpdate(bookingId, {
      razorpayPaymentId,
      razorpaySignature,
      status: 'paid',
      paymentStatus: 'paid',
    }, { new: true });
    res.json({ success: true, data: booking, message: 'Payment verified successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createMealOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT secret is not configured.' });
    }

    const {
      listingId,
      planName,
      serviceTier,
      duration,
      mealsPerDay,
      serviceDate,
      message,
    } = req.body;

    if (!listingId || !planName || !serviceTier) {
      return res.status(400).json({ success: false, message: 'Missing required booking details' });
    }

    if (!['daily', 'weekly', 'monthly'].includes(serviceTier)) {
      return res.status(400).json({ success: false, message: 'Invalid service tier' });
    }

    const meal = await MealService.findById(listingId).select('provider plans');
    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal service not found' });
    }

    const matchedPlan = (meal.plans || []).find(
      (plan: any) =>
        String(plan.name || '').trim().toLowerCase() ===
          String(planName || '').trim().toLowerCase() &&
        String(plan.tier || '').toLowerCase() === String(serviceTier || '').toLowerCase()
    );

    if (!matchedPlan) {
      return res.status(400).json({ success: false, message: 'Selected plan is not available for this meal service' });
    }

    const payableAmount = Number((matchedPlan as any).price);
    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid plan pricing for selected service' });
    }

    if (serviceTier === 'daily' && !serviceDate) {
      return res.status(400).json({ success: false, message: 'Please select a meal date for daily service' });
    }

    if (serviceTier === 'daily' && serviceDate) {
      const selectedDate = new Date(serviceDate);
      if (Number.isNaN(selectedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid daily service date' });
      }

      const selectedDateOnly = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowOnly = new Date(todayOnly);
      tomorrowOnly.setDate(tomorrowOnly.getDate() + 1);
      const thirdDayAfterTodayOnly = new Date(todayOnly);
      thirdDayAfterTodayOnly.setDate(thirdDayAfterTodayOnly.getDate() + 3);

      if (selectedDateOnly < tomorrowOnly || selectedDateOnly > thirdDayAfterTodayOnly) {
        return res.status(400).json({
          success: false,
          message: 'Daily meal service can only be requested for tomorrow and the following 2 days',
        });
      }
    }

    const isMockPayment = allowMockPayment();
    if (!isMockPayment && !hasRazorpayConfig()) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway is not configured for this environment.',
      });
    }

    let orderId = '';
    let orderAmount = Math.round(payableAmount * 100);
    let orderCurrency = 'INR';

    if (isMockPayment) {
      orderId = `mock_order_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    } else {
      const options = {
        amount: Math.round(payableAmount * 100),
        currency: 'INR',
        receipt: `meal_${Date.now().toString().slice(-8)}`,
      };

      const razorpay = getRazorpay();
      const order = await razorpay.orders.create(options);
      orderId = order.id;
      orderAmount = Number(order.amount);
      orderCurrency = order.currency;
    }

    const bookingToken = jwt.sign(
      {
        userId: req.user._id,
        listingId,
        providerId: meal.provider,
        planName,
        serviceTier,
        duration: duration || '',
        mealsPerDay: Number(mealsPerDay) || 0,
        amount: payableAmount,
        serviceDate: serviceDate || null,
        message: message || '',
        orderId,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '30m' }
    );

    res.json({
      success: true,
      data: {
        orderId,
        amount: orderAmount,
        currency: orderCurrency,
        mockPayment: isMockPayment,
        bookingToken,
      },
      message: 'Meal order created',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const confirmMockMealPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!allowMockPayment()) {
      return res.status(403).json({
        success: false,
        message: 'Mock payment mode is disabled.',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT secret is not configured.' });
    }

    const { bookingToken } = req.body;
    if (!bookingToken) {
      return res.status(400).json({ success: false, message: 'Missing booking token' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(bookingToken, process.env.JWT_SECRET as string);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired booking token' });
    }

    if (String(decoded.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Booking token does not belong to this user' });
    }

    const existing = await Booking.findOne({
      user: req.user._id,
      razorpayOrderId: decoded.orderId,
    });
    if (existing) {
      return res.json({ success: true, data: existing, message: 'Booking already confirmed' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      listing: decoded.listingId,
      listingType: 'meal',
      provider: decoded.providerId,
      bookingDetails: {
        planName: decoded.planName,
        duration: decoded.duration,
        serviceTier: decoded.serviceTier,
        serviceDate: decoded.serviceDate ? new Date(decoded.serviceDate) : undefined,
        message: decoded.message || '',
      },
      paymentAmount: Number(decoded.amount) || 0,
      razorpayOrderId: decoded.orderId,
      razorpayPaymentId: `mockpay_${Date.now().toString(36)}`,
      razorpaySignature: 'mock_signature',
      status: 'paid',
      paymentStatus: 'paid',
    });

    res.json({
      success: true,
      data: booking,
      message: 'Mock payment confirmed and booking created',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
