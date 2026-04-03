import { Request, Response } from 'express';
import ListingRequest from '../models/ListingRequest';
import PGListing from '../models/PGListing';
import MealService from '../models/MealService';
import Provider from '../models/Provider';
import { AuthRequest } from '../middleware/auth';

const errorMessage = (err: any, fallback = 'Unexpected server error') => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
};

const logControllerError = (label: string, err: any, req?: Request) => {
  const routeInfo = req ? `${req.method} ${req.originalUrl}` : '';
  console.error(`[${label}] ${routeInfo}`.trim());
  console.error(err);
};

const safeParseArray = (value: any, field: string) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new Error(`${field} must be an array`);
      }
      return parsed;
    } catch {
      throw new Error(`Invalid ${field} format`);
    }
  }
  return [];
};

export const saveListingDraft = async (req: AuthRequest, res: Response) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id });
    if (!providerDoc) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const { listingType, draftId, ...data } = req.body;
    const files = (req as any).files as Express.Multer.File[] || [];
    const photos = files.map((f: any) => f.path || f.secure_url || f.filename || f.originalname || '').filter(Boolean);

    let request;
    if (draftId) {
      // Update existing draft
      request = await ListingRequest.findByIdAndUpdate(
        draftId,
        {
          submittedData: data,
          photos,
          draftSavedAt: new Date(),
        },
        { new: true }
      );
    } else {
      // Create new draft
      request = await ListingRequest.create({
        provider: providerDoc._id,
        listingType,
        submittedData: data,
        photos,
        status: 'draft',
        draftSavedAt: new Date(),
      });
    }

    res.status(201).json({ success: true, data: request, message: 'Draft saved successfully' });
  } catch (err: any) {
    logControllerError('saveListingDraft', err, req);
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const updateDraft = async (req: AuthRequest, res: Response) => {
  try {
    const request = await ListingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Draft not found' });
    if (request.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only drafts can be updated' });
    }

    const { ...data } = req.body;
    const files = (req as any).files as Express.Multer.File[] || [];
    const photos = files.length > 0
      ? files.map((f: any) => f.path || f.secure_url || f.filename || f.originalname || '').filter(Boolean)
      : request.photos;

    request.submittedData = data;
    request.photos = photos;
    request.draftSavedAt = new Date();
    await (request as any).save();

    res.json({ success: true, data: request, message: 'Draft updated' });
  } catch (err: any) {
    logControllerError('updateDraft', err, req);
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const submitListingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id });
    if (!providerDoc) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const { listingType, draftId, ...data } = req.body;
    const files = (req as any).files as Express.Multer.File[] || [];
    const hasIncomingData = Object.keys(data || {}).length > 0;

    let request;
    let effectiveListingType = listingType as 'pg' | 'meal' | undefined;
    if (draftId) {
      // Submit existing draft
      request = await ListingRequest.findById(draftId);
      if (!request) return res.status(404).json({ success: false, message: 'Draft not found' });
      effectiveListingType = request.listingType;

      request.status = 'submitted';
      request.submittedAt = new Date();
      if (files.length > 0) {
        request.photos = files.map((f: any) => f.path || f.secure_url || f.filename || f.originalname || '').filter(Boolean);
      }
      if (hasIncomingData) {
        request.submittedData = {
          ...(request.submittedData || {}),
          ...data,
        };
      }
    } else {
      // Direct submission without draft
      const photos = files.map((f: any) => f.path || f.secure_url || f.filename || f.originalname || '').filter(Boolean);

      request = await ListingRequest.create({
        provider: providerDoc._id,
        listingType,
        submittedData: data,
        photos,
        status: 'submitted',
        submittedAt: new Date(),
      });
    }

    if (!effectiveListingType) {
      return res.status(400).json({ success: false, message: 'listingType is required' });
    }

    // Create draft listing record
    const listingData = {
      provider: providerDoc._id,
      ...request.submittedData,
      photos: request.photos,
      listingRequest: request._id,
      verificationStatus: 'pending',
    };

    let createdListing;
    if (effectiveListingType === 'pg') {
      const { roomTypes, amenities, rules, tags, latitude, longitude } = request.submittedData;
      const parsedRoomTypes = safeParseArray(roomTypes, 'roomTypes');
      const minPrice = Array.isArray(parsedRoomTypes) && parsedRoomTypes.length
        ? Math.min(...parsedRoomTypes.map((r: any) => Number(r.price) || 0))
        : 0;

      const pgPayload = {
        ...listingData,
        location: { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] },
        roomTypes: parsedRoomTypes,
        amenities: typeof amenities === 'string' ? amenities.split(',').map((s: string) => s.trim()) : amenities || [],
        rules: typeof rules === 'string' ? rules.split(',').map((s: string) => s.trim()) : rules || [],
        tags: typeof tags === 'string' ? tags.split(',').map((s: string) => s.trim()) : tags || [],
        minPrice,
      };

      if (request.createdListingId) {
        createdListing = await PGListing.findByIdAndUpdate(request.createdListingId, pgPayload, { new: true });
        if (!createdListing) {
          createdListing = await PGListing.create(pgPayload);
        }
      } else {
        createdListing = await PGListing.create(pgPayload);
      }
    } else if (effectiveListingType === 'meal') {
      const { plans, cuisines, dietTypes, mealTimings, latitude, longitude } = request.submittedData;
      const parsedPlans = safeParseArray(plans, 'plans');
      const minPrice = Array.isArray(parsedPlans) ? Math.min(...parsedPlans.map((p: any) => Number(p.price) || 0)) : 0;

      const mealPayload = {
        ...listingData,
        location: { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] },
        plans: parsedPlans,
        cuisines: typeof cuisines === 'string' ? cuisines.split(',').map((s: string) => s.trim()) : cuisines || [],
        dietTypes: typeof dietTypes === 'string' ? dietTypes.split(',').map((s: string) => s.trim()) : dietTypes || [],
        mealTimings: typeof mealTimings === 'string' ? mealTimings.split(',').map((s: string) => s.trim()) : mealTimings || [],
        minPrice,
      };

      if (request.createdListingId) {
        createdListing = await MealService.findByIdAndUpdate(request.createdListingId, mealPayload, { new: true });
        if (!createdListing) {
          createdListing = await MealService.create(mealPayload);
        }
      } else {
        createdListing = await MealService.create(mealPayload);
      }
    }

    if (!createdListing) {
      return res.status(500).json({ success: false, message: 'Failed to create or update listing for submission' });
    }

    request.createdListingId = createdListing._id;
    await (request as any).save();

    res.status(201).json({
      success: true,
      data: { request, listing: createdListing },
      message: 'Listing submitted for approval'
    });
  } catch (err: any) {
    logControllerError('submitListingRequest', err, req);
    const msg = errorMessage(err);
    const status = msg.startsWith('Invalid ') ? 400 : 500;
    res.status(status).json({ success: false, message: msg });
  }
};

export const getProviderListingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id });
    if (!providerDoc) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const requests = await ListingRequest.find({ provider: providerDoc._id })
      .sort('-createdAt')
      .populate('provider', 'businessName');

    res.json({ success: true, data: requests, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const getAdminListingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'submitted', page = 1, limit = 20 } = req.query;
    const filter: any = { status: { $in: (status as string).split(',') } };

    const total = await ListingRequest.countDocuments(filter);
    const requests = await ListingRequest.find(filter)
      .populate('provider', 'businessName businessEmail businessPhone')
      .sort('-submittedAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: { requests, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      message: 'Success',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const approveListing = async (req: AuthRequest, res: Response) => {
  try {
    const request = await ListingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'approved';
    request.reviewedAt = new Date();
    await (request as any).save();

    // Update the draft listing to mark as approved
    const Model = request.listingType === 'pg' ? PGListing : MealService;
    await (Model as any).findByIdAndUpdate(request.createdListingId, {
      verificationStatus: 'approved',
    });

    res.json({ success: true, data: request, message: 'Listing approved' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const rejectListing = async (req: AuthRequest, res: Response) => {
  try {
    const { adminFeedback } = req.body;
    const request = await ListingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'rejected';
    request.adminFeedback = adminFeedback || '';
    request.reviewedAt = new Date();
    await (request as any).save();

    // Update the draft listing to mark as rejected
    const Model = request.listingType === 'pg' ? PGListing : MealService;
    await (Model as any).findByIdAndUpdate(request.createdListingId, {
      verificationStatus: 'rejected',
    });

    res.json({ success: true, data: request, message: 'Listing rejected' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const requestRevisions = async (req: AuthRequest, res: Response) => {
  try {
    const { adminFeedback } = req.body;
    const request = await ListingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'revision_requested';
    request.adminFeedback = adminFeedback || '';
    request.reviewedAt = new Date();
    await (request as any).save();

    res.json({ success: true, data: request, message: 'Revision requested' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const resubmitListing = async (req: AuthRequest, res: Response) => {
  try {
    const request = await ListingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const { ...data } = req.body;
    const files = (req as any).files as Express.Multer.File[] || [];

    // Update with new data
    request.submittedData = data;
    if (files.length > 0) {
      request.photos = files.map((f: any) => f.path || f.secure_url || f.filename || f.originalname || '').filter(Boolean);
    }
    request.status = 'submitted';
    request.submittedAt = new Date();
    await (request as any).save();

    // Update the draft listing
    const Model = request.listingType === 'pg' ? PGListing : MealService;
    const updateData: any = {
      ...data,
      photos: request.photos,
      verificationStatus: 'pending',
    };

    if (request.listingType === 'pg') {
      const { roomTypes, amenities, rules, tags, latitude, longitude } = data;
      const parsedRoomTypes = safeParseArray(roomTypes, 'roomTypes');
      updateData.location = { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] };
      updateData.roomTypes = parsedRoomTypes;
      updateData.amenities = typeof amenities === 'string' ? amenities.split(',').map((s: string) => s.trim()) : amenities || [];
      updateData.rules = typeof rules === 'string' ? rules.split(',').map((s: string) => s.trim()) : rules || [];
      updateData.tags = typeof tags === 'string' ? tags.split(',').map((s: string) => s.trim()) : tags || [];
    } else if (request.listingType === 'meal') {
      const { plans, cuisines, dietTypes, mealTimings, latitude, longitude } = data;
      updateData.location = { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] };
      updateData.plans = safeParseArray(plans, 'plans');
      updateData.cuisines = typeof cuisines === 'string' ? cuisines.split(',').map((s: string) => s.trim()) : cuisines || [];
      updateData.dietTypes = typeof dietTypes === 'string' ? dietTypes.split(',').map((s: string) => s.trim()) : dietTypes || [];
      updateData.mealTimings = typeof mealTimings === 'string' ? mealTimings.split(',').map((s: string) => s.trim()) : mealTimings || [];
    }

    await (Model as any).findByIdAndUpdate(request.createdListingId, updateData);

    res.json({ success: true, data: request, message: 'Listing resubmitted for review' });
  } catch (err: any) {
    logControllerError('resubmitListing', err, req);
    const msg = errorMessage(err);
    const status = msg.startsWith('Invalid ') ? 400 : 500;
    res.status(status).json({ success: false, message: msg });
  }
};

export const editListingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id });
    if (!providerDoc) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const request = await ListingRequest.findOne({ _id: req.params.id, provider: providerDoc._id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Approved listings cannot be edited from requests' });
    }

    const data = req.body || {};
    const files = ((req as any).files as Express.Multer.File[]) || [];

    request.submittedData = {
      ...(request.submittedData || {}),
      ...data,
    };
    if (files.length > 0) {
      request.photos = files.map((f: any) => f.path || f.secure_url || f.filename || f.originalname || '').filter(Boolean);
    }
    request.status = 'submitted';
    request.adminFeedback = '';
    request.submittedAt = new Date();
    await (request as any).save();

    const listingBase = {
      ...request.submittedData,
      photos: request.photos,
      listingRequest: request._id,
      verificationStatus: 'pending',
    } as any;

    if (request.listingType === 'pg') {
      const { roomTypes, amenities, rules, tags, latitude, longitude } = request.submittedData;
      const parsedRoomTypes = safeParseArray(roomTypes, 'roomTypes');
      const minPrice = Array.isArray(parsedRoomTypes) && parsedRoomTypes.length
        ? Math.min(...parsedRoomTypes.map((r: any) => Number(r.price) || 0))
        : 0;

      const pgPayload = {
        ...listingBase,
        location: { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] },
        roomTypes: parsedRoomTypes,
        amenities: typeof amenities === 'string' ? amenities.split(',').map((s: string) => s.trim()) : amenities || [],
        rules: typeof rules === 'string' ? rules.split(',').map((s: string) => s.trim()) : rules || [],
        tags: typeof tags === 'string' ? tags.split(',').map((s: string) => s.trim()) : tags || [],
        minPrice,
      };

      if (request.createdListingId) {
        await PGListing.findByIdAndUpdate(request.createdListingId, pgPayload);
      }
    }

    if (request.listingType === 'meal') {
      const { plans, cuisines, dietTypes, mealTimings, latitude, longitude } = request.submittedData;
      const parsedPlans = safeParseArray(plans, 'plans');
      const minPrice = Array.isArray(parsedPlans) && parsedPlans.length
        ? Math.min(...parsedPlans.map((p: any) => Number(p.price) || 0))
        : 0;

      const mealPayload = {
        ...listingBase,
        location: { type: 'Point', coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] },
        plans: parsedPlans,
        cuisines: typeof cuisines === 'string' ? cuisines.split(',').map((s: string) => s.trim()) : cuisines || [],
        dietTypes: typeof dietTypes === 'string' ? dietTypes.split(',').map((s: string) => s.trim()) : dietTypes || [],
        mealTimings: typeof mealTimings === 'string' ? mealTimings.split(',').map((s: string) => s.trim()) : mealTimings || [],
        minPrice,
      };

      if (request.createdListingId) {
        await MealService.findByIdAndUpdate(request.createdListingId, mealPayload);
      }
    }

    res.json({ success: true, data: request, message: 'Listing request updated and resubmitted' });
  } catch (err: any) {
    logControllerError('editListingRequest', err, req);
    const msg = errorMessage(err);
    const status = msg.startsWith('Invalid ') ? 400 : 500;
    res.status(status).json({ success: false, message: msg });
  }
};

export const deleteRejectedListingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id });
    if (!providerDoc) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const request = await ListingRequest.findOne({ _id: req.params.id, provider: providerDoc._id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected listings can be deleted' });
    }

    const Model = request.listingType === 'pg' ? PGListing : MealService;
    if (request.createdListingId) {
      await (Model as any).findByIdAndDelete(request.createdListingId);
    }

    await ListingRequest.findByIdAndDelete(request._id);

    res.json({ success: true, data: null, message: 'Rejected listing deleted' });
  } catch (err: any) {
    logControllerError('deleteRejectedListingRequest', err, req);
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

export const deleteDraft = async (req: AuthRequest, res: Response) => {
  try {
    const request = await ListingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Draft not found' });
    if (request.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only drafts can be deleted' });
    }

    await ListingRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Draft deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: errorMessage(err) });
  }
};
