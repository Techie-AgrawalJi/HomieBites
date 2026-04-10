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
  const raw = String(this.password || '');
  const candidates = Array.from(new Set([
    raw,
    raw.trim(),
    raw.replace(/^"|"$/g, '').trim(),
    raw.replace(/^'|'$/g, '').trim(),
    raw.startsWith('{bcrypt}') ? raw.slice(8).trim() : raw,
  ])).filter(Boolean);

  const passwordsToTry = Array.from(new Set([
    String(password || ''),
    String(password || '').trim(),
  ]));

  const normalizeBcryptHash = (hash: string) => {
    if (hash.startsWith('$2y$') || hash.startsWith('$2x$')) {
      return `$2b$${hash.slice(4)}`;
    }
    return hash;
  };

  for (const candidate of candidates) {
    if (/^\$2[abxy]\$\d{2}\$/.test(candidate)) {
      const normalizedHash = normalizeBcryptHash(candidate);
      for (const pwd of passwordsToTry) {
        try {
          if (await bcrypt.compare(pwd, normalizedHash)) {
            return true;
          }
        } catch {
          // Try next candidate format.
        }
      }
    }

    if (/^[a-f0-9]{128}$/i.test(candidate)) {
      for (const pwd of passwordsToTry) {
        const sha512 = crypto.createHash('sha512').update(pwd).digest('hex');
        if (sha512.toLowerCase() === candidate.toLowerCase()) {
          return true;
        }
      }
    }

    if (/^[a-f0-9]{64}$/i.test(candidate)) {
      for (const pwd of passwordsToTry) {
        const sha256 = crypto.createHash('sha256').update(pwd).digest('hex');
        if (sha256.toLowerCase() === candidate.toLowerCase()) {
          return true;
        }
      }
    }

    if (/^[a-f0-9]{40}$/i.test(candidate)) {
      for (const pwd of passwordsToTry) {
        const sha1 = crypto.createHash('sha1').update(pwd).digest('hex');
        if (sha1.toLowerCase() === candidate.toLowerCase()) {
          return true;
        }
      }
    }

    if (/^[a-f0-9]{32}$/i.test(candidate)) {
      for (const pwd of passwordsToTry) {
        const md5 = crypto.createHash('md5').update(pwd).digest('hex');
        if (md5.toLowerCase() === candidate.toLowerCase()) {
          return true;
        }
      }
    }

    for (const pwd of passwordsToTry) {
      if (candidate === pwd) {
        return true;
      }
    }
  }

  return false;
};

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export default mongoose.model<IUser>('User', UserSchema);
