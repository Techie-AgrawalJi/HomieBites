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

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_BASE_URL || 'http://localhost:5000',
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

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'HomieBites API is running' });
});

export default app;
