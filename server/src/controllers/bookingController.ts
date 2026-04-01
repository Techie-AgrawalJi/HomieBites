import { Response } from 'express';
import Booking from '../models/Booking';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { listing, listingType, provider, bookingDetails, paymentAmount } = req.body;
    const booking = await Booking.create({
      user: req.user._id,
      listing,
      listingType,
      provider,
      bookingDetails,
      paymentAmount: paymentAmount || 0,
      status: 'pending',
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { bookings: booking._id } });
    res.status(201).json({ success: true, data: booking, message: 'Booking request sent' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: bookings, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProviderBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ provider: req.params.providerId }).sort('-createdAt').populate('user', 'name email phone');
    res.json({ success: true, data: bookings, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, providerResponse, paymentAmount } = req.body;
    const update: any = { status };
    if (providerResponse) update.providerResponse = providerResponse;
    if (paymentAmount) update.paymentAmount = paymentAmount;
    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: booking, message: 'Status updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllBookings = async (_req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find().sort('-createdAt').populate('user', 'name email').populate('provider', 'businessName');
    res.json({ success: true, data: bookings, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
