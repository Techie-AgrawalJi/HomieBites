import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

const normalizeRoleForClient = (role: string) => (role === 'admin' ? 'superadmin' : role);
const normalizeIdentifier = (value: string) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  const token = signToken(user._id.toString());
  const days = parseInt(process.env.COOKIE_EXPIRY || '7');
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: normalizeRoleForClient(user.role),
      city: user.city,
    },
    message: 'Success',
  });
};

const isBcryptHash = (value: string) => /^\$2[abxy]\$\d{2}\$/.test(value || '');
const findUserByEmail = async (email: string, includePassword = false) => {
  const normalizedEmail = normalizeIdentifier(email);
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

  const legacyUser = await legacyQuery;
  if (legacyUser) return legacyUser;

  // Extra fallback for very old records where email may contain unexpected whitespace.
  const regexFallback = User.findOne({
    email: { $regex: new RegExp(`^\\s*${escapeRegex(normalizedEmail)}\\s*$`, 'i') },
  });
  if (includePassword) {
    regexFallback.select('+password');
  }

  return regexFallback;
};

const findUserByProviderBusinessEmail = async (email: string, includePassword = false) => {
  const normalizedEmail = normalizeIdentifier(email);
  if (!normalizedEmail) return null;

  const provider = await Provider.findOne({
    $or: [
      { businessEmail: normalizedEmail },
      {
        $expr: {
          $eq: [
            { $toLower: { $trim: { input: '$businessEmail' } } },
            normalizedEmail,
          ],
        },
      },
      {
        businessEmail: { $regex: new RegExp(`^\\s*${escapeRegex(normalizedEmail)}\\s*$`, 'i') },
      },
    ],
  }).select('user');

  if (!provider?.user) return null;

  const query = User.findById(provider.user);
  if (includePassword) {
    query.select('+password');
  }
  return query;
};

const findUserForLogin = async (identifier: string, includePassword = false) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  if (!normalizedIdentifier) return null;

  let user = await findUserByEmail(normalizedIdentifier, includePassword);
  if (user) return user;

  user = await findUserByProviderBusinessEmail(normalizedIdentifier, includePassword);
  if (user) return user;

  // Legacy fallback: allow phone-based login for old production accounts.
  const phoneCandidate = String(identifier || '').trim();
  const query = User.findOne({ phone: phoneCandidate });
  if (includePassword) {
    query.select('+password');
  }
  return query;
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
    sendTokenResponse(user, 201, res);
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
    const identifier = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await findUserForLogin(identifier, true);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.isLocked()) {
      return res.status(423).json({ success: false, message: 'Account locked. Try again after 15 minutes.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
      const lockUntil = failedLoginAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await User.updateOne(
        { _id: user._id },
        failedLoginAttempts >= 5
          ? { $set: { failedLoginAttempts: 0, lockUntil } }
          : { $set: { failedLoginAttempts }, $unset: { lockUntil: '' } }
      );
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const postLoginUpdate: any = {
      failedLoginAttempts: 0,
      lockUntil: null,
    };

    // Backward compatibility: migrate legacy non-bcrypt passwords to bcrypt without full document validation.
    if (!isBcryptHash(String(user.password || ''))) {
      postLoginUpdate.password = await bcrypt.hash(password, 12);
    }

    await User.updateOne(
      { _id: user._id },
      { $set: postLoginUpdate }
    );

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
    sendTokenResponse(user, 200, res);
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
    const sanitizedUser = {
      ...user.toObject(),
      role: normalizeRoleForClient(String(user.role || 'user')),
    };

    res.json({ success: true, data: { user: sanitizedUser, provider: providerData }, message: 'Success' });
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

