import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  role: 'user' | 'provider' | 'superadmin' | 'admin';
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
  role: { type: String, enum: ['user', 'provider', 'superadmin', 'admin'], default: 'user' },
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
  const isBcryptHash = /^\$2[abxy]\$\d{2}\$/.test(stored);

  if (isBcryptHash) {
    const normalizedHash = stored.startsWith('$2y$') || stored.startsWith('$2x$')
      ? `$2b$${stored.slice(4)}`
      : stored;

    try {
      return await bcrypt.compare(password, normalizedHash);
    } catch {
      return false;
    }
  }

  // Legacy fallback: some historical records may store SHA hashes instead of bcrypt.
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const sha256 = crypto.createHash('sha256').update(password).digest('hex');
    return sha256.toLowerCase() === stored.toLowerCase();
  }

  if (/^[a-f0-9]{40}$/i.test(stored)) {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex');
    return sha1.toLowerCase() === stored.toLowerCase();
  }

  return stored === password;
};

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export default mongoose.model<IUser>('User', UserSchema);
