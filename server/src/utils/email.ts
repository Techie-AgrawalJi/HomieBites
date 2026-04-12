import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

let hasVerifiedTransporter = false;

const ensureEmailConfig = () => {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter((key) => !String(process.env[key] || '').trim());
  if (missing.length) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  ensureEmailConfig();

  if (!hasVerifiedTransporter) {
    await transporter.verify();
    hasVerifiedTransporter = true;
  }

  const fromAddress = String(process.env.SENDER_EMAIL || process.env.SMTP_USER || '').trim();
  const info = await transporter.sendMail({
    from: `HomieBites <${fromAddress}>`,
    to,
    subject,
    html,
  });

  // Nodemailer may resolve even when provider rejects recipients.
  if (!info.accepted?.length || (info.rejected && info.rejected.length > 0)) {
    throw new Error(`Email provider rejected delivery. accepted=${info.accepted?.length || 0}, rejected=${info.rejected?.length || 0}`);
  }
};

