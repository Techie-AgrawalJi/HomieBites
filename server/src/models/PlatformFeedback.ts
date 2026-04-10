import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformFeedback extends Document {
  submittedBy: mongoose.Types.ObjectId;
  submitterRole: 'user' | 'provider';
  category: 'feature-request' | 'bug-report' | 'ux-feedback' | 'other';
  title: string;
  message: string;
  status: 'new' | 'in-review' | 'planned' | 'closed';
}

const PlatformFeedbackSchema = new Schema<IPlatformFeedback>({
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submitterRole: { type: String, enum: ['user', 'provider'], required: true },
  category: { type: String, enum: ['feature-request', 'bug-report', 'ux-feedback', 'other'], default: 'feature-request' },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['new', 'in-review', 'planned', 'closed'], default: 'new' },
}, { timestamps: true });

PlatformFeedbackSchema.index({ createdAt: -1 });
PlatformFeedbackSchema.index({ submittedBy: 1, createdAt: -1 });

export default mongoose.model<IPlatformFeedback>('PlatformFeedback', PlatformFeedbackSchema);
