import connectDB from '../config/db';
import User from '../models/User';
import Provider from '../models/Provider';

const args = new Set(process.argv.slice(2));
const shouldApply = args.has('--apply');

const normalizeText = (value: string) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

const normalizeEmail = (value: string) => normalizeText(value).toLowerCase();

const normalizePasswordStorage = (value: string) => {
  const base = String(value || '');
  const trimmed = normalizeText(base)
    .replace(/^"|"$/g, '')
    .replace(/^'|'$/g, '');

  if (trimmed.startsWith('{bcrypt}')) {
    return trimmed.slice(8).trim();
  }

  if (trimmed.startsWith('$2y$') || trimmed.startsWith('$2x$')) {
    return `$2b$${trimmed.slice(4)}`;
  }

  return trimmed;
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Export it before running this migration.');
  }

  await connectDB(3, 300);

  const users = await User.find({}).select('_id email role password failedLoginAttempts lockUntil');
  const providers = await Provider.find({}).select('_id businessEmail');

  const normalizedEmailMap = new Map<string, string[]>();
  for (const user of users) {
    const n = normalizeEmail(String(user.email || ''));
    if (!n) continue;
    const list = normalizedEmailMap.get(n) || [];
    list.push(String(user._id));
    normalizedEmailMap.set(n, list);
  }

  const conflictingNormalizedEmails = new Set(
    Array.from(normalizedEmailMap.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([email]) => email)
  );

  let usersScanned = 0;
  let usersWouldUpdate = 0;
  let usersUpdated = 0;
  let userConflicts = 0;

  for (const user of users) {
    usersScanned += 1;
    const originalEmail = String(user.email || '');
    const normalizedEmail = normalizeEmail(originalEmail);
    const originalRole = String((user as any).role || 'user');
    const normalizedRole = originalRole === 'admin' ? 'superadmin' : originalRole;
    const originalPassword = String((user as any).password || '');
    const normalizedPassword = normalizePasswordStorage(originalPassword);

    const update: Record<string, any> = {};

    if (normalizedEmail && originalEmail !== normalizedEmail) {
      if (conflictingNormalizedEmails.has(normalizedEmail)) {
        userConflicts += 1;
      } else {
        update.email = normalizedEmail;
      }
    }

    if (originalRole !== normalizedRole) {
      update.role = normalizedRole;
    }

    if (originalPassword !== normalizedPassword && normalizedPassword) {
      update.password = normalizedPassword;
    }

    if (Number((user as any).failedLoginAttempts || 0) !== 0) {
      update.failedLoginAttempts = 0;
    }

    if ((user as any).lockUntil) {
      update.lockUntil = null;
    }

    if (!Object.keys(update).length) {
      continue;
    }

    usersWouldUpdate += 1;

    if (shouldApply) {
      await User.updateOne({ _id: user._id }, { $set: update });
      usersUpdated += 1;
    }
  }

  let providersScanned = 0;
  let providersWouldUpdate = 0;
  let providersUpdated = 0;

  for (const provider of providers) {
    providersScanned += 1;
    const originalBusinessEmail = String((provider as any).businessEmail || '');
    const normalizedBusinessEmail = normalizeEmail(originalBusinessEmail);
    if (!normalizedBusinessEmail || normalizedBusinessEmail === originalBusinessEmail) {
      continue;
    }

    providersWouldUpdate += 1;
    if (shouldApply) {
      await Provider.updateOne(
        { _id: provider._id },
        { $set: { businessEmail: normalizedBusinessEmail } }
      );
      providersUpdated += 1;
    }
  }

  const modeLabel = shouldApply ? 'APPLY MODE' : 'DRY RUN';
  console.log('--- Legacy Auth Data Migration ---');
  console.log(`Mode: ${modeLabel}`);
  console.log(`Users scanned: ${usersScanned}`);
  console.log(`Users with changes: ${usersWouldUpdate}`);
  console.log(`Users updated: ${usersUpdated}`);
  console.log(`Users with email conflicts: ${userConflicts}`);
  console.log(`Providers scanned: ${providersScanned}`);
  console.log(`Providers with changes: ${providersWouldUpdate}`);
  console.log(`Providers updated: ${providersUpdated}`);

  if (conflictingNormalizedEmails.size) {
    console.log('Conflicting normalized user emails (manual cleanup needed):');
    for (const email of conflictingNormalizedEmails) {
      const ids = normalizedEmailMap.get(email) || [];
      console.log(` - ${email}: ${ids.join(', ')}`);
    }
  }

  if (!shouldApply) {
    console.log('No changes were written. Re-run with --apply to persist updates.');
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error?.message || error);
    process.exit(1);
  });
