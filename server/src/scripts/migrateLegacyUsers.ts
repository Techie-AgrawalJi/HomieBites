import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
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

const applyMode = process.argv.includes('--apply');

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

  await mongoose.connect(mongoUri);

  const users = await User.find({}).select('_id email role password').lean();

  let inspected = 0;
  let changed = 0;

  for (const user of users) {
    inspected += 1;
    const currentEmail = String((user as any).email || '');
    const currentRole = String((user as any).role || '');
    const currentPassword = String((user as any).password || '');

    const nextEmail = normalize(currentEmail);
    const nextRole = currentRole === 'admin' ? 'superadmin' : currentRole;
    const nextPassword = currentPassword.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

    const update: Record<string, string> = {};

    if (nextEmail && nextEmail !== currentEmail) {
      update.email = nextEmail;
    }
    if (nextRole && nextRole !== currentRole) {
      update.role = nextRole;
    }
    if (nextPassword && nextPassword !== currentPassword) {
      update.password = nextPassword;
    }

    if (Object.keys(update).length > 0) {
      changed += 1;
      console.log(`Candidate update for user ${String((user as any)._id)}:`, update);
      if (applyMode) {
        await User.updateOne({ _id: (user as any)._id }, { $set: update });
      }
    }
  }

  console.log(`Inspected ${inspected} users.`);
  console.log(`${applyMode ? 'Applied' : 'Found'} ${changed} updates.`);

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Legacy migration failed:', err?.message || err);
    try {
      await mongoose.disconnect();
    } catch {
      // no-op
    }
    process.exit(1);
  });
