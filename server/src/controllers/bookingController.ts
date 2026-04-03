import { Response } from 'express';
import Booking from '../models/Booking';
import MealService from '../models/MealService';
import PGListing from '../models/PGListing';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role === 'provider' || req.user.role === 'superadmin' || req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Providers and admins cannot create booking requests' });
    }

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
    const bookings = await Booking.find({ user: req.user._id }).sort('-createdAt').lean();

    const mealListingIds = bookings
      .filter((booking) => booking.listingType === 'meal')
      .map((booking) => booking.listing);

    const pgListingIds = bookings
      .filter((booking) => booking.listingType === 'pg')
      .map((booking) => booking.listing);

    const [mealListings, pgListings] = await Promise.all([
      mealListingIds.length
        ? MealService.find({ _id: { $in: mealListingIds } })
          .select('providerName address city photos minPrice')
          .lean()
        : Promise.resolve([]),
      pgListingIds.length
        ? PGListing.find({ _id: { $in: pgListingIds } })
          .select('name address city photos minPrice')
          .lean()
        : Promise.resolve([]),
    ]);

    const mealMap = new Map(mealListings.map((listing) => [String(listing._id), listing]));
    const pgMap = new Map(pgListings.map((listing) => [String(listing._id), listing]));

    const enrichedBookings = bookings.map((booking) => {
      const key = String(booking.listing);
      const listing = booking.listingType === 'meal' ? mealMap.get(key) : pgMap.get(key);

      return {
        ...booking,
        listingDetails: listing
          ? {
              name: (listing as any).name || (listing as any).providerName,
              providerName: (listing as any).providerName,
              address: (listing as any).address,
              city: (listing as any).city,
              photo: (listing as any).photos?.[0],
              minPrice: (listing as any).minPrice,
            }
          : null,
      };
    });

    res.json({ success: true, data: enrichedBookings, message: 'Success' });
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
