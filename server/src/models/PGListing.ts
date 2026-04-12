import mongoose, { Schema, Document } from 'mongoose';

export interface IPGListing extends Document {
  provider: mongoose.Types.ObjectId;
  name: string;
  description: string;
  address: string;
  city: string;
  landmark: string;
  distanceFromLandmark: string;
  gender: 'male' | 'female' | 'unisex';
  furnishing:
    | 'furnished'
    | 'semi-furnished'
    | 'unfurnished'
    | 'furnished-semi-furnished'
    | 'furnished-unfurnished'
    | 'semi-furnished-unfurnished'
    | 'mixed';
  roomTypes: {
    type: string;
    price: number;
    availability: number;
    total: number;
  }[];
  amenities: string[];
  rules: string[];
  photos: string[];
  tags: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  featured: boolean;
  verified: boolean;
  averageRating: number;
  reviewCount: number;
  bookings: mongoose.Types.ObjectId[];
  reviews: mongoose.Types.ObjectId[];
  contactName: string;
  contactPhone: string;
  minPrice: number;
  listingRequest?: mongoose.Types.ObjectId;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
}

const PGListingSchema = new Schema<IPGListing>({
  provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  landmark: { type: String, default: '' },
  distanceFromLandmark: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'unisex'], required: true },
  furnishing: {
    type: String,
    enum: [
      'furnished',
      'semi-furnished',
      'unfurnished',
      'furnished-semi-furnished',
      'furnished-unfurnished',
      'semi-furnished-unfurnished',
      'mixed',
    ],
    required: true,
  },
  roomTypes: [{
    type: { type: String },
    price: Number,
    availability: Number,
    total: Number,
  }],
  amenities: [String],
  rules: [String],
  photos: [String],
  tags: [String],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  featured: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  contactName: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  minPrice: { type: Number, default: 0 },
  listingRequest: { type: Schema.Types.ObjectId, ref: 'ListingRequest' },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

PGListingSchema.index({ location: '2dsphere' });
PGListingSchema.index({ city: 1, gender: 1, furnishing: 1 });

export default mongoose.model<IPGListing>('PGListing', PGListingSchema);
