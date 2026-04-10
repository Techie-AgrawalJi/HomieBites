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

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header) and approved browser origins.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
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
