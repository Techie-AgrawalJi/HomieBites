import mongoose, { Schema, Document } from 'mongoose';

export interface IMealService extends Document {
  provider: mongoose.Types.ObjectId;
  providerName: string;
  description: string;
  address: string;
  city: string;
  cuisines: string[];
  dietTypes: string[];
  mealTimings: string[];
  plans: {
    name: string;
    price: number;
    duration: string;
    mealsPerDay: number;
  }[];
  deliveryRadius: number;
  sampleMenu: {
    day: string;
    items: string[];
  }[];
  photos: string[];
  kitchenPhotos: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  featured: boolean;
  verified: boolean;
  averageRating: number;
  reviewCount: number;
  subscriptions: mongoose.Types.ObjectId[];
  reviews: mongoose.Types.ObjectId[];
  contactPhone: string;
  minPrice: number;
  listingRequest?: mongoose.Types.ObjectId;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
}

const MealServiceSchema = new Schema<IMealService>({
  provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  providerName: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  cuisines: [String],
  dietTypes: [String],
  mealTimings: [String],
  plans: [{
    name: String,
    price: Number,
    duration: String,
    mealsPerDay: Number,
  }],
  deliveryRadius: { type: Number, default: 3 },
  sampleMenu: [{
    day: String,
    items: [String],
  }],
  photos: [String],
  kitchenPhotos: [String],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  featured: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  contactPhone: { type: String, default: '' },
  minPrice: { type: Number, default: 0 },
  listingRequest: { type: Schema.Types.ObjectId, ref: 'ListingRequest' },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

MealServiceSchema.index({ location: '2dsphere' });
MealServiceSchema.index({ city: 1 });

export default mongoose.model<IMealService>('MealService', MealServiceSchema);
