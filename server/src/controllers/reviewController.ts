import mongoose from 'mongoose';
import { Response, Request } from 'express';
import Review from '../models/Review';
import PGListing from '../models/PGListing';
import MealService from '../models/MealService';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

const LISTING_TYPE_VALUES = ['pg', 'meal'] as const;

const getListingModel = (listingType: string): mongoose.Model<any> => {
  if (listingType === 'pg') return PGListing as mongoose.Model<any>;
  return MealService as mongoose.Model<any>;
};

const normalizeStats = (averageRating: number, reviewCount: number) => ({
  averageRating: Number((averageRating || 0).toFixed(1)),
  reviewCount: reviewCount || 0,
});

export const getReviews = async (req: Request, res: Response) => {
  try {
    const { listingId, listingType, page = 1, limit = 20 } = req.query;
    const normalizedType = String(listingType || '').toLowerCase();

    if (!listingId || !mongoose.Types.ObjectId.isValid(String(listingId))) {
      return res.status(400).json({ success: false, message: 'Valid listingId is required' });
    }

    if (!LISTING_TYPE_VALUES.includes(normalizedType as 'pg' | 'meal')) {
      return res.status(400).json({ success: false, message: 'listingType must be pg or meal' });
    }

    const listingModel = getListingModel(normalizedType);
    const listing = await listingModel.findById(String(listingId)).select('averageRating reviewCount');
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const reviews = await Review.find({
      listing: String(listingId),
      listingType: normalizedType,
    })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user', 'name');

    const total = await Review.countDocuments({
      listing: String(listingId),
      listingType: normalizedType,
    });

    res.json({
      success: true,
      data: {
        reviews,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        ...normalizeStats(Number((listing as any).averageRating || 0), Number((listing as any).reviewCount || 0)),
      },
      message: 'Success',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrUpdateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, listingType, rating, comment, photos = [] } = req.body;
    const normalizedType = String(listingType || '').toLowerCase();
    const normalizedRating = Number(rating);
    const normalizedComment = String(comment || '').trim();

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only registered users can post reviews' });
    }

    if (!listingId || !mongoose.Types.ObjectId.isValid(String(listingId))) {
      return res.status(400).json({ success: false, message: 'Valid listingId is required' });
    }

    if (!LISTING_TYPE_VALUES.includes(normalizedType as 'pg' | 'meal')) {
      return res.status(400).json({ success: false, message: 'listingType must be pg or meal' });
    }

    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }

    if (!normalizedComment) {
      return res.status(400).json({ success: false, message: 'comment is required' });
    }

    const listingModel = getListingModel(normalizedType);
    const listingDoc = await listingModel.findById(String(listingId));
    if (!listingDoc) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const optedBooking = await Booking.findOne({
      user: req.user._id,
      listing: String(listingId),
      listingType: normalizedType,
      status: { $in: ['approved', 'paid', 'completed'] },
    }).select('_id status');

    if (!optedBooking) {
      return res.status(403).json({
        success: false,
        message: 'You can review this listing only after opting this service',
      });
    }

    const verifiedBooker = ['paid', 'completed'].includes(String(optedBooking.status || ''));

    let review = await Review.findOne({
      user: req.user._id,
      listing: String(listingId),
      listingType: normalizedType,
    });

    if (review) {
      review.rating = normalizedRating;
      review.comment = normalizedComment;
      review.photos = Array.isArray(photos) ? photos.filter((p: unknown) => typeof p === 'string') : [];
      review.verifiedBooker = verifiedBooker;
      await review.save();
    } else {
      review = await Review.create({
        user: req.user._id,
        listing: String(listingId),
        listingType: normalizedType,
        rating: normalizedRating,
        comment: normalizedComment,
        photos: Array.isArray(photos) ? photos.filter((p: unknown) => typeof p === 'string') : [],
        verifiedBooker,
      });
      await listingModel.findByIdAndUpdate(String(listingId), { $addToSet: { reviews: review._id } });
    }

    const stats = await Review.aggregate([
      {
        $match: {
          listing: new mongoose.Types.ObjectId(String(listingId)),
          listingType: normalizedType,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const averageRating = Number(stats[0]?.averageRating || 0);
    const reviewCount = Number(stats[0]?.reviewCount || 0);

    await listingModel.findByIdAndUpdate(String(listingId), {
      averageRating: Number(averageRating.toFixed(1)),
      reviewCount,
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    res.status(201).json({
      success: true,
      data: {
        review: populatedReview,
        ...normalizeStats(averageRating, reviewCount),
      },
      message: 'Review saved successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
