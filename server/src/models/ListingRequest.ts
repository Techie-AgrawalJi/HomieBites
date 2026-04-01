import mongoose, { Schema, Document } from 'mongoose';

export interface IListingRequest extends Document {
  provider: mongoose.Types.ObjectId;
  listingType: 'pg' | 'meal';
  submittedData: any;
  photos: string[];
  roomTypes?: any[];
  plans?: any[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  adminFeedback?: string;
  draftSavedAt?: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdListingId?: mongoose.Types.ObjectId;
}

const ListingRequestSchema = new Schema<IListingRequest>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    listingType: { type: String, enum: ['pg', 'meal'], required: true },
    submittedData: { type: Schema.Types.Mixed, default: {} },
    photos: [String],
    roomTypes: [Schema.Types.Mixed],
    plans: [Schema.Types.Mixed],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'revision_requested'],
      default: 'draft',
    },
    adminFeedback: { type: String, default: '' },
    draftSavedAt: Date,
    submittedAt: Date,
    reviewedAt: Date,
    createdListingId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

ListingRequestSchema.index({ provider: 1, status: 1 });
ListingRequestSchema.index({ status: 1, listingType: 1 });

export default mongoose.model<IListingRequest>('ListingRequest', ListingRequestSchema);
