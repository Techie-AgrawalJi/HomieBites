import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  role: 'user' | 'provider' | 'superadmin';
  savedListings: mongoose.Types.ObjectId[];
  bookings: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  isLocked(): boolean;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'provider', 'superadmin'], default: 'user' },
  savedListings: [{ type: Schema.Types.ObjectId }],
  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  const stored = String(this.password || '');
  const isHash = /^\$2[aby]\$\d{2}\$/.test(stored);

  if (!isHash) {
    return stored === password;
  }

  try {
    return await bcrypt.compare(password, stored);
  } catch {
    return false;
  }
};

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export default mongoose.model<IUser>('User', UserSchema);
