# Vercel Deployment Guide

This repo is now configured for a single Vercel project:
- Frontend: static Vite app from `client`
- Backend: serverless function at `api/index.ts` using Express app from `server/src/app.ts`

## 1. Prerequisites

1. Push latest code to GitHub.
2. Have MongoDB Atlas connection string ready.
3. Have Razorpay and Cloudinary credentials ready (if payment/upload flows are used).

## 2. Create Vercel Project

1. Go to Vercel dashboard.
2. Import this GitHub repository.
3. Keep project root as repository root (`Listing-Hub`) because `vercel.json` is at root.
4. Deploy once (it may fail if env vars are missing; that is expected).

## 3. Add Environment Variables (Project Settings -> Environment Variables)

Set these for Preview and Production:

- `MONGODB_URI` = your MongoDB connection string
- `JWT_SECRET` = strong random secret
- `FRONTEND_BASE_URL` = your Vercel app URL (e.g. `https://your-app.vercel.app`)
- `SENDER_EMAIL` = from-email (if mail flow enabled)
- `EMAIL_USER` = SMTP username
- `EMAIL_PASS` = SMTP password
- `RAZORPAY_KEY_ID` = Razorpay key id
- `RAZORPAY_KEY_SECRET` = Razorpay key secret
- `CLOUDINARY_CLOUD_NAME` = Cloudinary cloud name
- `CLOUDINARY_API_KEY` = Cloudinary api key
- `CLOUDINARY_API_SECRET` = Cloudinary api secret

If you already use additional env vars in server `.env`, add all of them in Vercel too.

## 4. Redeploy

1. Trigger a redeploy from Vercel dashboard after adding env vars.
2. Verify:
   - `https://<your-domain>/api/health` returns success JSON
   - Home page loads
   - Login/signup works
   - Listing APIs work from UI

## 5. Cookie/Auth Notes

1. This setup uses same-domain API (`/api`), so cookie auth works without cross-domain changes.
2. Keep `withCredentials: true` in frontend axios (already configured).

## 6. Local Development (unchanged)

Use:

- `npm run dev` (root)

This still runs client + server locally as before.

## 7. Troubleshooting

1. `500` on `/api/*`:
   - Check `MONGODB_URI` and server env vars in Vercel.
2. Auth redirect loops:
   - Ensure `FRONTEND_BASE_URL` matches deployed URL.
3. Payment/upload failures:
   - Verify Razorpay/Cloudinary keys are set in same environment.
