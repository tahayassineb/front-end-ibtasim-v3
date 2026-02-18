# Convex Backend Deployment Guide

## Overview
This guide will walk you through deploying the Ibtasim backend to Convex.

## Prerequisites
- You already have a Convex account
- You have the Convex CLI installed (comes with `npm install convex`)

---

## Step 1: Deploy Schema & Functions

Open your terminal and run:

```bash
cd front-end-ibtasim-v3
npx convex dev --once --configure=new
```

This will:
1. Create a new Convex project (or use existing)
2. Deploy the database schema
3. Deploy all API functions
4. Generate the `_generated/` folder with types

---

## Step 2: Get Your Convex URL

After deployment, Convex will output your deployment URL. It looks like:
```
https://your-project-name.convex.cloud
```

Copy this URL.

---

## Step 3: Update Environment Variables

Edit the `.env.local` file in `front-end-ibtasim-v3/`:

```env
VITE_CONVEX_URL=https://your-actual-project.convex.cloud
```

Replace with your actual Convex URL.

---

## Step 4: Verify Deployment

Check that everything is deployed:

```bash
npx convex logs
```

You should see no errors.

---

## Step 5: Test the API

Create a test script or use the Convex dashboard to verify:

1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to "Data" tab
4. You should see empty tables: users, projects, donations, etc.

---

## API Endpoints Available

After deployment, these endpoints are live:

### Users
- `api.users.getUserById`
- `api.users.getUserByPhone`
- `api.users.createUser`
- `api.users.updateUser`

### Projects
- `api.projects.getProjects`
- `api.projects.getProjectById`
- `api.projects.getFeaturedProjects`
- `api.projects.createProject`
- `api.projects.updateProject`
- `api.projects.deleteProject`

### Donations
- `api.donations.getDonationsByUser`
- `api.donations.getDonationsByProject`
- `api.donations.getPendingVerifications`
- `api.donations.createDonation`
- `api.donations.verifyDonation`
- `api.donations.uploadReceipt`

### Admin
- `api.admin.getDashboardStats`
- `api.admin.getDonors`
- `api.admin.getDonorById`
- `api.admin.getVerifications`

### Auth
- `api.auth.registerUser`
- `api.auth.requestOTP`
- `api.auth.verifyOTP`

---

## Next Steps

Once Convex is deployed, the frontend will automatically connect to it via the `ConvexProvider` in `main.jsx`.

### Frontend Integration Needed

The frontend code is ready but needs to be updated to use Convex instead of localStorage:

1. Update `AppContext.jsx` to use Convex auth
2. Update `ProjectsList.jsx` to use `useQuery(api.projects.getProjects)`
3. Update `AdminProjects.jsx` to use Convex mutations
4. Update `DonationFlow.jsx` to create real donations

---

## Troubleshooting

### "Cannot find module './_generated/server'"
This is normal until you run `npx convex dev`. The `_generated` folder is auto-created.

### "Failed to connect to Convex"
Check that `VITE_CONVEX_URL` in `.env.local` is correct and restart the dev server.

### Schema errors
If you see schema validation errors, check the Convex dashboard logs for details.

---

## Production Deployment

When ready for production:

```bash
npx convex deploy
```

This deploys to your production Convex instance.

Then update your production environment variables in Vercel/Netlify with the production Convex URL.