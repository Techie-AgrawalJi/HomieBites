import { Request, Response } from 'express';
import MealService from '../models/MealService';
import PGListing from '../models/PGListing';
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

export const getMealServices = async (req: Request, res: Response) => {
  try {
    const { city, dietType, mealTiming, planType, minPrice, maxPrice, lat, lng, radius, page = 1, limit = 12 } = req.query;
    const filter: any = publicVisibilityFilter();
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (dietType) filter.dietTypes = { $in: [(dietType as string)] };
    if (mealTiming) filter.mealTimings = { $in: [(mealTiming as string)] };
    if (planType) {
      const normalized = String(planType).toLowerCase();
      if (['daily', 'weekly', 'monthly'].includes(normalized)) {
        filter['plans.tier'] = normalized;
      } else {
        filter['plans.name'] = { $regex: planType as string, $options: 'i' };
      }
    }
    if (minPrice || maxPrice) {
      filter.minPrice = {};
      if (minPrice) filter.minPrice.$gte = Number(minPrice);
      if (maxPrice) filter.minPrice.$lte = Number(maxPrice);
    }

    let query: any;
    if (lat && lng) {
      const radiusMetres = Number(radius) || 5000;
      query = MealService.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: radiusMetres,
          },
        },
      });
    } else {
      query = MealService.find(filter);
    }

    const total = await MealService.countDocuments(filter);
    const services = await query
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: { services, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      message: 'Success',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMealService = async (req: Request, res: Response) => {
  try {
    const service = await MealService.findById(req.params.id).populate('provider', 'businessName businessPhone');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    const [lon, lat] = service.location.coordinates;
    const nearbyPGs = await PGListing.find({
      ...publicVisibilityFilter(),
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: 5000,
        },
      },
    }).limit(6);

    const nearbyWithDistance = nearbyPGs.map((pg) => {
      const [plon, plat] = pg.location.coordinates;
      const dist = Math.sqrt(Math.pow((plat - lat) * 111000, 2) + Math.pow((plon - lon) * 111000 * Math.cos(lat * Math.PI / 180), 2));
      return { ...pg.toObject(), distanceString: formatDistance(dist) };
    });

    res.json({ success: true, data: { service, nearbyPGListings: nearbyWithDistance }, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createMealService = async (req: AuthRequest, res: Response) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id });
    if (!providerDoc) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const { latitude, longitude, plans, cuisines, dietTypes, mealTimings, sampleMenu, ...rest } = req.body;
    const files = (req as any).files as Express.Multer.File[] || [];
    const photos = files.map((f: any) => f.path || f.secure_url || '').filter(Boolean);
    if (!photos.length) {
      return res.status(400).json({ success: false, message: 'Please upload at least one meal service photo' });
    }
    const parsedPlans = typeof plans === 'string' ? JSON.parse(plans) : plans || [];
    const minPrice = Array.isArray(parsedPlans) ? Math.min(...parsedPlans.map((p: any) => Number(p.price) || 0)) : 0;
    const service = await MealService.create({
      ...rest,
      provider: providerDoc._id,
      photos,
      location: { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] },
      plans: parsedPlans,
      cuisines: typeof cuisines === 'string' ? cuisines.split(',').map((s: string) => s.trim()) : cuisines || [],
      dietTypes: typeof dietTypes === 'string' ? dietTypes.split(',').map((s: string) => s.trim()) : dietTypes || [],
      mealTimings: typeof mealTimings === 'string' ? mealTimings.split(',').map((s: string) => s.trim()) : mealTimings || [],
      sampleMenu: typeof sampleMenu === 'string' ? JSON.parse(sampleMenu) : sampleMenu || [],
      minPrice,
    });
    res.status(201).json({ success: true, data: service, message: 'Service created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteMealService = async (req: AuthRequest, res: Response) => {
  try {
    await MealService.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFeaturedMeal = async (_req: Request, res: Response) => {
  try {
    const services = await MealService.find({
      ...publicVisibilityFilter(),
      featured: true,
    }).limit(6);
    res.json({ success: true, data: services, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProviderMealServices = async (req: AuthRequest, res: Response) => {
  try {
    const includePending = req.query.includePending === 'true';
    const filter: any = { provider: req.params.providerId };
    if (!includePending) {
      filter.$or = [{ verificationStatus: 'approved' }, { verified: true }];
    }

    const services = await MealService.find(filter).sort('-createdAt');
    res.json({ success: true, data: services, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
