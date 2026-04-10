import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const normalize = (value: string) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing');
  }

  const email = normalize(process.env.ADMIN_EMAIL || 'admin@homiebites.com');
  const password = String(process.env.ADMIN_PASSWORD || 'Admin@12345').trim();
  const name = String(process.env.ADMIN_NAME || 'Super Admin').trim();
  const city = String(process.env.ADMIN_CITY || 'Mumbai').trim();
  const phone = String(process.env.ADMIN_PHONE || '9999999999').trim();

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be non-empty');
  }

  await mongoose.connect(mongoUri);

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({
    $expr: {
      $eq: [
        { $toLower: { $trim: { input: '$email' } } },
        email,
      ],
    },
  }).select('_id');

  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          email,
          city,
          phone,
          role: 'superadmin',
          password: passwordHash,
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      }
    );
    console.log(`Updated admin user: ${email}`);
  } else {
    await User.create({
      name,
      email,
      city,
      phone,
      role: 'superadmin',
      password: passwordHash,
      failedLoginAttempts: 0,
      lockUntil: undefined,
    });
    console.log(`Created admin user: ${email}`);
  }

  console.log('Admin bootstrap completed.');
  console.log(`Login with: ${email} / ${password}`);

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Admin bootstrap failed:', err?.message || err);
    try {
      await mongoose.disconnect();
    } catch {
      // no-op
    }
    process.exit(1);
  });
