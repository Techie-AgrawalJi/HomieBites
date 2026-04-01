import mongoose, { Schema, Document } from 'mongoose';

export interface IProvider extends Document {
  user: mongoose.Types.ObjectId;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  city: string;
  serviceType: 'pg' | 'meal' | 'both';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  verificationDocuments: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  listings: mongoose.Types.ObjectId[];
  paymentSettings?: {
    upiId?: string;
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
  };
}

const ProviderSchema = new Schema<IProvider>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  businessPhone: { type: String, required: true },
  businessEmail: { type: String, required: true },
  businessAddress: { type: String, required: true },
  city: { type: String, required: true },
  serviceType: { type: String, enum: ['pg', 'meal', 'both'], required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: { type: [Number], default: [0, 0] },
  },
  verificationDocuments: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  rejectionReason: String,
  listings: [{ type: Schema.Types.ObjectId }],
  paymentSettings: {
    upiId: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
  },
}, { timestamps: true });

ProviderSchema.index({ location: '2dsphere' });

export default mongoose.model<IProvider>('Provider', ProviderSchema);
