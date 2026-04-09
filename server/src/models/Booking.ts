import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  listingType: 'pg' | 'meal';
  provider: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'paid' | 'completed';
  bookingDetails: {
    roomType?: string;
    planName?: string;
    startDate?: Date;
    duration?: string;
    serviceTier?: 'daily' | 'weekly' | 'monthly';
    serviceDate?: Date;
    message?: string;
  };
  paymentAmount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  providerResponse?: string;
}

const BookingSchema = new Schema<IBooking>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: Schema.Types.ObjectId, required: true, refPath: 'listingModel' },
  listingType: { type: String, enum: ['pg', 'meal'], required: true },
  provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'paid', 'completed'], default: 'pending' },
  bookingDetails: {
    roomType: String,
    planName: String,
    startDate: Date,
    duration: String,
    serviceTier: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    serviceDate: Date,
    message: String,
  },
  paymentAmount: { type: Number, default: 0 },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  providerResponse: String,
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', BookingSchema);
