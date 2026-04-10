import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import PGListing from '../models/PGListing';
import Provider from '../models/Provider';
import { sendEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRY || '7d') as any,
  });
};

const isCrossSiteRequest = (req: Request) => {
  const origin = String(req.headers.origin || '');
  const requestHost = String(req.headers['x-forwarded-host'] || req.get('host') || '');
  if (!origin || !requestHost) return false;

  try {
    return new URL(origin).host.toLowerCase() !== requestHost.toLowerCase();
  } catch {
    return false;
  }
};

const sendTokenResponse = (req: Request, user: any, statusCode: number, res: Response) => {
  const token = signToken(user._id.toString());
  const days = parseInt(process.env.COOKIE_EXPIRY || '7');
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const isHttps = forwardedProto === 'https' || process.env.NODE_ENV === 'production';
  const crossSite = isCrossSiteRequest(req);

  res.cookie('token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
    maxAge: days * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
    },
    message: 'Success',
  });
};

const isBcryptHash = (value: string) => /^\$2[abxy]\$\d{2}\$/.test(value || '');
const findUserByEmail = async (email: string, includePassword = false) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  // Fast path for records already normalized by current schema behavior.
  const query = User.findOne({ email: normalizedEmail });
  if (includePassword) {
    query.select('+password');
  }
  const exactUser = await query;
  if (exactUser) return exactUser;

  // Legacy compatibility: old production records may include mixed case or stray spaces.
  const legacyQuery = User.findOne({
    $expr: {
      $eq: [
        { $toLower: { $trim: { input: '$email' } } },
        normalizedEmail,
      ],
    },
  });

  if (includePassword) {
    legacyQuery.select('+password');
  }

  return legacyQuery;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, phone, city, password, confirmPassword, role } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, phone, city, password, role: 'user' });
    sendTokenResponse(req, user, 201, res);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const providerSignup = async (req: Request, res: Response) => {
  try {
    const {
      name, phone, city, password, confirmPassword,
      businessName, businessPhone, businessEmail, businessAddress,
      serviceType, latitude, longitude,
    } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, phone, city, password, role: 'provider' });
    const files = (req as any).files as Express.Multer.File[] || [];
    const docs = files.map((f: any) => f.path || f.secure_url || '');
    await Provider.create({
      user: user._id,
      businessName, businessPhone, businessEmail, businessAddress, city,
      serviceType: serviceType || 'pg',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
      },
      verificationDocuments: docs,
      status: 'pending',
    });
    res.status(201).json({
      success: true,
      data: null,
      message: 'Provider registration submitted. Awaiting admin approval.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.isLocked()) {
      return res.status(423).json({ success: false, message: 'Account locked. Try again after 15 minutes.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Backward compatibility: migrate legacy plaintext passwords to bcrypt.
    if (!isBcryptHash(user.password)) {
      user.password = password;
      user.markModified('password');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    if (user.role === 'provider') {
      const provider = await Provider.findOne({ user: user._id });
      if (provider) {
        if (provider.status === 'pending') {
          return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
        }
        if (provider.status === 'rejected') {
          return res.status(403).json({ success: false, message: `Account rejected: ${provider.rejectionReason}` });
        }
        if (provider.status === 'suspended') {
          return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
        }
      }
    }
    sendTokenResponse(req, user, 200, res);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.cookie('token', '', { maxAge: 0, httpOnly: true });
  res.json({ success: true, data: null, message: 'Logged out' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let providerData = null;
    if (user.role === 'provider') {
      providerData = await Provider.findOne({ user: user._id });
    }
    res.json({ success: true, data: { user, provider: providerData }, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSavedListings = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.savedListings.length) {
      return res.json({ success: true, data: [], message: 'No saved listings' });
    }
    const listings = await PGListing.find({ _id: { $in: user.savedListings } });
    res.json({ success: true, data: listings, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProviderPaymentSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { upiId, accountHolder, bankName, accountNumber } = req.body;
    const provider = await Provider.findOneAndUpdate(
      { user: req.user._id },
      {
        paymentSettings: {
          upiId: upiId || '',
          accountHolder: accountHolder || '',
          bankName: bankName || '',
          accountNumber: accountNumber || '',
        },
      },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    res.json({
      success: true,
      data: provider.paymentSettings,
      message: 'Payment settings updated',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim();
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user with that email' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.FRONTEND_BASE_URL}/reset-password/${token}`;
    await sendEmail(email, 'HomieBites Password Reset', `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password (valid for 1 hour):</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `);
    res.json({ success: true, data: null, message: 'Reset link sent to your email' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, data: null, message: 'Password reset successful' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

