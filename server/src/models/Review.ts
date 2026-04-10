import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  listingType: 'pg' | 'meal';
  rating: number;
  comment: string;
  photos: string[];
  verifiedBooker: boolean;
}

const ReviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: Schema.Types.ObjectId, required: true },
  listingType: { type: String, enum: ['pg', 'meal'], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  photos: [String],
  verifiedBooker: { type: Boolean, default: false },
}, { timestamps: true });

ReviewSchema.index({ listing: 1, listingType: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, listing: 1, listingType: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
