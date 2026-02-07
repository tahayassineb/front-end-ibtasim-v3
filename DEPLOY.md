# 🚀 Deploy to Netlify

## Option 1: One-Click Deploy (Easiest)

Click this button to deploy directly to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tahayassineb/ibtasim-front-end-v2)

## Option 2: Manual Steps

1. Go to [https://app.netlify.com/](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize Netlify
4. Select the repository: `tahayassineb/ibtasim-front-end-v2`
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy site**

## Build Settings (Already Configured)

The `netlify.toml` file in this repo already has the correct settings:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## After Deployment

- Your site will be live at: `https://[random-name].netlify.app`
- You can set a custom domain in Netlify settings
- Every push to `master` will auto-deploy

## Environment Variables (if needed)

If your app needs API keys, add them in:
**Site settings** → **Environment variables**