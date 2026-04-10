import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import pgRoutes from './routes/pg';
import mealRoutes from './routes/meal';
import bookingRoutes from './routes/booking';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payment';
import listingRequestRoutes from './routes/listingRequest';
import reviewRoutes from './routes/review';
import platformFeedbackRoutes from './routes/platformFeedback';

const app = express();

const configuredOrigins = (process.env.FRONTEND_BASE_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '').toLowerCase();
const configuredOriginSet = new Set(configuredOrigins.map(normalizeOrigin));

const isVercelOrigin = (origin: string) => {
  try {
    return /\.vercel\.app$/i.test(new URL(origin).hostname);
  } catch {
    return false;
  }
};

const isSameHostRequest = (origin: string, req: express.Request) => {
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const requestHost = String(req.headers['x-forwarded-host'] || req.get('host') || '').toLowerCase();
    return !!requestHost && originHost === requestHost;
  } catch {
    return false;
  }
};

const defaultDevOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
  'http://localhost:5002',
  'http://127.0.0.1:5002',
  'http://localhost:5003',
  'http://127.0.0.1:5003',
];

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(process.env.NODE_ENV !== 'production' ? defaultDevOrigins : []),
]);

const allowedOriginSet = new Set(Array.from(allowedOrigins).map(normalizeOrigin));

app.use(cors((req, callback) => {
  const origin = String(req.headers.origin || '');

  // Allow non-browser requests (no Origin header).
  if (!origin) {
    return callback(null, { origin: true, credentials: true });
  }

  const normalized = normalizeOrigin(origin);
  const isAllowedConfigured = allowedOriginSet.has(normalized) || configuredOriginSet.has(normalized);
  const isAllowedSameHost = isSameHostRequest(origin, req);
  const isAllowedVercel = process.env.NODE_ENV === 'production' && isVercelOrigin(origin);

  if (isAllowedConfigured || isAllowedSameHost || isAllowedVercel) {
    return callback(null, { origin: true, credentials: true });
  }

  return callback(new Error(`Not allowed by CORS: ${origin}`));
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/pg', pgRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/listing-requests', listingRequestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/platform-feedback', platformFeedbackRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'HomieBites API is running' });
});

export default app;
