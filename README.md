# Listing Hub (HomieBites)

A full-stack marketplace for city-based **PG accommodations** and **meal services**.

The platform connects seekers with verified providers, supports role-based dashboards, booking and payment flows, listing approval workflows, and an admin control panel.

## Project Goals

- Help users discover PG and meal options in one place.
- Enable providers to onboard and manage listings.
- Give admins moderation and platform oversight controls.
- Support production deployment on Vercel with a serverless API entry.

## Target Users

- Users (students, working professionals, newcomers to a city)
- Service providers (PG owners/managers, meal service providers)
- Platform admins (moderation, approvals, platform analytics)

## Core Features

- Authentication and authorization
  - User signup/login/logout
  - Provider signup with document upload
  - Password reset (forgot/reset)
  - Role-based route protection (`user`, `provider`, `superadmin`)
- Listings and discovery
  - PG listings: browse, featured, details, provider-owned listings
  - Meal services: browse, featured, details, provider-owned services
  - City exploration and discovery pages
  - Save listings for authenticated users
- Booking and payments
  - Booking creation and booking management
  - Provider booking status updates
  - Razorpay payment order + verification flow
  - Mock payment confirm route for non-production/dev cases
- Reviews and feedback
  - Create or update listing reviews
  - Platform feedback submission and user feedback history
- Provider workflow
  - Listing request submission/edit flow with media uploads
  - Approval/rejection/revision loop through admin review
- Admin controls
  - Stats and platform overview
  - Provider management and status updates
  - Listing moderation (including featured toggles)
  - Listing request approvals/rejections/revision requests

## Product Workflow

1. A user signs up or logs in.
2. The user explores listings by city, category, or featured sections.
3. The user can save listings, create bookings, and complete payment.
4. Providers sign up, submit listing requests, and manage approved inventory.
5. Admin reviews provider applications and listing requests, then approves/rejects/requires revisions.

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- GSAP (animations)
- Axios
- React Hot Toast

### Backend

- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT auth + cookie-based session handling
- Multer + Cloudinary (uploads)
- Nodemailer (email/reset flows)
- Razorpay (payments)

### Monorepo Tooling / Shared Libraries

- OpenAPI spec + Orval code generation in `lib/api-spec`
- Generated React Query API client in `lib/api-client-react`
- Generated Zod schemas in `lib/api-zod`
- Drizzle/Postgres workspace package in `lib/db` (tooling package, separate from current runtime MongoDB server)

### Deployment

- Vercel
  - Static frontend from `client/dist`
  - Serverless API entry via `api/index.ts` forwarding to `server/src/app.ts`

## Repository Structure

```text
.
|- api/                # Vercel serverless API entry
|- client/             # React + Vite frontend
|- server/             # Express backend
|- lib/
|  |- api-spec/        # OpenAPI + Orval config
|  |- api-client-react/# Generated React Query client package
|  |- api-zod/         # Generated Zod schema package
|  |- db/              # Drizzle/Postgres package
|- scripts/            # Workspace helper scripts
|- data/               # Local database artifacts (development)
|- vercel.json         # Vercel build + route config
```

## Local Development

### Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- MongoDB instance (local or Atlas)

### Install

```bash
npm run install:all
```

### Start Development (client + server)

```bash
npm run dev
```

This runs:

- Server on port `3000`
- Client on port `5000` (Vite)

The root `predev` script also clears common stale dev ports before startup.

### Seed Data

```bash
npm run seed
```

## Important Scripts

### Root

- `npm run dev` - start client and server concurrently
- `npm run seed` - seed backend data
- `npm run install:all` - install root, client, and server dependencies

### Client (`client/package.json`)

- `npm run dev`
- `npm run build`
- `npm run preview`

### Server (`server/package.json`)

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run seed`
- `npm run migrate:legacy-users`
- `npm run migrate:legacy-users:apply`

### API Spec / Codegen

From `lib/api-spec`:

- `npm run codegen`

### DB Package

From `lib/db`:

- `npm run push`
- `npm run push-force`

## Environment Variables

Set these for local/prod as needed:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `COOKIE_EXPIRY`
- `FRONTEND_BASE_URL`
- `PORT`
- `NODE_ENV`

Email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (optional)
- `SMTP_USER`
- `SMTP_PASS`
- `SENDER_EMAIL`

Payments:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Media uploads:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## API Overview

Base path: `/api`

- `/api/auth` - auth, profile, saved listings, password reset
- `/api/pg` - PG listing CRUD and featured/list/detail routes
- `/api/meal` - meal service CRUD and featured/list/detail routes
- `/api/bookings` - booking create/history/status updates
- `/api/payments` - Razorpay order/verify flows
- `/api/listing-requests` - provider submission/edit/delete workflow
- `/api/reviews` - listing reviews
- `/api/platform-feedback` - user/provider feedback
- `/api/admin` - admin stats and moderation routes
- `/api/health` - health check

## Deployment

See `DEPLOY_VERCEL.md` for a full production checklist.

High-level deployment model:

1. Vercel builds the frontend from `client`.
2. Requests to `/api/*` are routed to `api/index.ts`.
3. The serverless handler initializes DB connection and forwards into the Express app.

## Notes for Contributors

- Keep role-based access behavior consistent between frontend protected routes and backend middleware.
- Provider listing lifecycle should flow through listing requests for moderation consistency.
- If server install issues occur due to peer dependencies, use the same strategy already encoded in root `postinstall`/Vercel config (`--legacy-peer-deps` for server install).
