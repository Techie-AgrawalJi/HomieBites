import { Response } from 'express';
import User from '../models/User';
import Provider from '../models/Provider';
import PGListing from '../models/PGListing';
import MealService from '../models/MealService';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

export const getStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [users, providers, pgListings, mealServices, bookings] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Provider.countDocuments(),
      PGListing.countDocuments(),
      MealService.countDocuments(),
      Booking.countDocuments(),
    ]);
    res.json({ success: true, data: { users, providers, pgListings, mealServices, bookings }, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProviderApplications = async (_req: AuthRequest, res: Response) => {
  try {
    const providers = await Provider.find({ status: 'pending' }).populate('user', 'name email phone');
    res.json({ success: true, data: providers, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllProviders = async (_req: AuthRequest, res: Response) => {
  try {
    const providers = await Provider.find().populate('user', 'name email phone');
    res.json({ success: true, data: providers, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProviderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejectionReason } = req.body;
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason },
      { new: true }
    );
    res.json({ success: true, data: provider, message: 'Provider status updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllListings = async (_req: AuthRequest, res: Response) => {
  try {
    const [pgs, meals] = await Promise.all([
      PGListing.find().populate('provider', 'businessName'),
      MealService.find().populate('provider', 'businessName'),
    ]);
    res.json({ success: true, data: { pgs, meals }, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleFeatured = async (req: AuthRequest, res: Response) => {
  try {
    const { type, id } = req.params;
    const Model = type === 'pg' ? PGListing : MealService;
    const listing = await (Model as any).findById(id);
    if (!listing) return res.status(404).json({ success: false, message: 'Not found' });
    listing.featured = !listing.featured;
    await listing.save();
    res.json({ success: true, data: listing, message: 'Featured toggled' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json({ success: true, data: users, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const city = String(req.body?.city || '').trim();
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!name || !email || !phone || !city || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const admin = await User.create({
      name,
      email,
      phone,
      city,
      password,
      role: 'superadmin',
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        city: admin.city,
        role: admin.role,
      },
      message: 'Admin created successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
