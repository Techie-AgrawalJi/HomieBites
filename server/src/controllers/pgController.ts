import { Request, Response } from 'express';
import PGListing from '../models/PGListing';
import MealService from '../models/MealService';
import Provider from '../models/Provider';
import { AuthRequest } from '../middleware/auth';
import { formatDistance } from '../utils/distance';

const publicVisibilityFilter = () => ({
  $and: [
    { verificationStatus: { $ne: 'rejected' } },
    {
      $or: [
        { verificationStatus: 'approved' },
        { verified: true },
      ],
    },
  ],
});

export const getPGListings = async (req: Request, res: Response) => {
  try {
    const { city, gender, furnishing, minBudget, maxBudget, amenities, roomType, lat, lng, radius, page = 1, limit = 12 } = req.query;
    const filter: any = publicVisibilityFilter();
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (gender) filter.gender = gender;
    if (furnishing) filter.furnishing = furnishing;
    if (amenities) {
      const amenitiesList = (amenities as string).split(',');
      filter.amenities = { $all: amenitiesList };
    }
    if (roomType) filter['roomTypes.type'] = { $regex: roomType, $options: 'i' };
    if (minBudget || maxBudget) {
      filter.minPrice = {};
      if (minBudget) filter.minPrice.$gte = Number(minBudget);
      if (maxBudget) filter.minPrice.$lte = Number(maxBudget);
    }

    let query: any;
    if (lat && lng) {
      const radiusMetres = Number(radius) || 5000;
      query = PGListing.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: radiusMetres,
          },
        },
      });
    } else {
      query = PGListing.find(filter);
    }

    const total = await PGListing.countDocuments(filter);
    const listings = await query
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('provider', 'businessName');

    res.json({
      success: true,
      data: { listings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      message: 'Success',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPGListing = async (req: Request, res: Response) => {
  try {
    const listing = await PGListing.findById(req.params.id).populate('provider', 'businessName businessPhone');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    const [lon, lat] = listing.location.coordinates;
    const nearbyMeals = await MealService.find({
      ...publicVisibilityFilter(),
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: 5000,
        },
      },
    }).limit(6);

    const nearbyWithDistance = nearbyMeals.map((meal) => {
      const [mlon, mlat] = meal.location.coordinates;
      const dist = Math.sqrt(Math.pow((mlat - lat) * 111000, 2) + Math.pow((mlon - lon) * 111000 * Math.cos(lat * Math.PI / 180), 2));
      return { ...meal.toObject(), distanceString: formatDistance(dist) };
    });

    res.json({ success: true, data: { listing, nearbyMealServices: nearbyWithDistance }, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPGListing = async (req: AuthRequest, res: Response) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id });
    if (!providerDoc) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const { latitude, longitude, roomTypes, amenities, rules, tags, ...rest } = req.body;
    const files = (req as any).files as Express.Multer.File[] || [];
    const photos = files.map((f: any) => f.path || f.secure_url || '').filter(Boolean);
    if (!photos.length) {
      return res.status(400).json({ success: false, message: 'Please upload at least one PG photo' });
    }
    const parsedRoomTypes = typeof roomTypes === 'string' ? JSON.parse(roomTypes) : roomTypes || [];
    const minPrice = Array.isArray(parsedRoomTypes) && parsedRoomTypes.length
      ? Math.min(...parsedRoomTypes.map((r: any) => Number(r.price) || 0))
      : 0;
    const listing = await PGListing.create({
      ...rest,
      provider: providerDoc._id,
      photos,
      location: { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] },
      roomTypes: parsedRoomTypes,
      amenities: typeof amenities === 'string' ? amenities.split(',').map((s: string) => s.trim()).filter(Boolean) : amenities || [],
      rules: typeof rules === 'string' ? rules.split(',').map((s: string) => s.trim()).filter(Boolean) : rules || [],
      tags: typeof tags === 'string' ? tags.split(',').map((s: string) => s.trim()).filter(Boolean) : tags || [],
      minPrice,
    });
    res.status(201).json({ success: true, data: listing, message: 'Listing created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePGListing = async (req: AuthRequest, res: Response) => {
  try {
    const listing = await PGListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: listing, message: 'Updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePGListing = async (req: AuthRequest, res: Response) => {
  try {
    await PGListing.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveListing = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const listingId = req.params.id;
    const idx = user.savedListings.indexOf(listingId);
    if (idx > -1) {
      user.savedListings.splice(idx, 1);
    } else {
      user.savedListings.push(listingId);
    }
    await user.save();
    res.json({ success: true, data: user.savedListings, message: 'Saved listings updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFeaturedPG = async (_req: Request, res: Response) => {
  try {
    const listings = await PGListing.find({
      ...publicVisibilityFilter(),
      featured: true,
    }).limit(6);
    res.json({ success: true, data: listings, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProviderPGListings = async (req: AuthRequest, res: Response) => {
  try {
    const includePending = req.query.includePending === 'true';
    const filter: any = { provider: req.params.providerId };
    if (!includePending) {
      filter.$or = [{ verificationStatus: 'approved' }, { verified: true }];
    }

    const listings = await PGListing.find(filter).sort('-createdAt');
    res.json({ success: true, data: listings, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
