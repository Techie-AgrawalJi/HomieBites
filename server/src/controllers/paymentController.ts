import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

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
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
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
