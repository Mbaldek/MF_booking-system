# 🌐 Vercel Setup & Deployment Guide

**Project:** Event Eats (Maison Félicien)  
**Status:** Ready to deploy  
**Estimated Time:** 15 minutes  

---

## Prerequisites

- ✅ GitHub repository created and code pushed
- ✅ Supabase project initialized (schema applied)
- ✅ GitHub Secrets configured (3 secrets added)
- ✅ `.env.local` file exists locally

---

## Step 1: Create Vercel Project (5 minutes)

### 1.1 Go to Vercel Dashboard

1. Open https://vercel.com/dashboard in your browser
2. Sign in with GitHub (if not already logged in)
   - Click **Sign In** → **Continue with GitHub**
   - Authorize Vercel to access your GitHub account

### 1.2 Create New Project

1. Click **Add New** button (top right)
2. Select **Project** from dropdown
3. Click **Import Git Repository**

### 1.3 Select Repository

1. Make sure **GitHub** is selected as the Git provider
2. In the search box, type: `MF_booking-system`
3. Click on **Mbaldek/MF_booking-system** to select it
4. Click **Import** button

---

## Step 2: Configure Project Settings (5 minutes)

### 2.1 Project Name & Framework Detection

After import, Vercel will show configuration options:

**Verify these settings:**

| Setting | Expected Value | Status |
|---------|----------------|--------|
| **Project Name** | `MF_booking-system` or `event-eats` (auto) | ✅ OK as-is |
| **Framework** | Vite | ✅ Auto-detected |
| **Root Directory** | `.` (dot) | ✅ Already correct |

If different:
- Project Name: Change to `event-eats` for cleaner URL
- Framework: Select **Other** → **Vite** if not auto-detected
- Root Directory: Keep as `.`

### 2.2 Build Settings

Vercel should auto-detect:

```
Install Command:  npm install
Build Command:    npm run build
Output Directory: dist
```

**Verify in the build section:**
- ✅ All three are filled correctly
- If not visible, leave default (Vercel will auto-detect)

### 2.3 Add Environment Variables

This is critical! These variables are needed for the build to work.

**Click: Environment Variables section**

Add three variables (click "Add" button for each):

#### Variable 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://nodywhjtymmzzxllggnu.supabase.co`
- **Environments**: Select all (Production, Preview, Development)
- Click **Add**

#### Variable 2: VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzExODMsImV4cCI6MjA4Nzc0NzE4M30.EI1dShtkxoElVDLKH5GyzPCFqT8EdETP_bU1zqrYyFI`
- **Environments**: Select all
- Click **Add**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE3MTE4MywiZXhwIjoyMDg3NzQ3MTgzfQ.rUm5w2QlURlRCEcG_vaAEOe7v3oW5jsZGay0AO_3_6c`
- **Environments**: Select all (or just Production for security)
- Click **Add**

⚠️ **IMPORTANT**: After adding, you should see all 3 variables listed without showing their values (Vercel hides secrets)

---

## Step 3: Deploy (5 minutes)

### 3.1 Start Deployment

1. Scroll to bottom of configuration page
2. Click **Deploy** button (large blue button)
3. Wait for deployment to complete (~3-5 minutes)

**What happens:**
- Vercel clones your repository
- Installs dependencies: `npm install`
- Builds the project: `npm run build`
- Deploys to Vercel's CDN
- Runs health checks

### 3.2 Monitor Deployment

The page will show:
- ⏳ "Analyzing..." → Building dependencies
- ⏳ "Building..." → Running npm run build
- ⏳ "Uploading..." → Sending to servers
- ✅ "Production" → Deployment complete!

### 3.3 Important: Check Build Errors

If build fails (red X instead of green checkmark):

1. Click on the failed deployment
2. Go to **Logs** tab
3. Scroll through to find the error
4. Common errors:
   - `Cannot find module '@supabase/supabase-js'` → Dependencies issue
   - `VITE_SUPABASE_URL is undefined` → Missing environment variable
   - Port already in use → Usually fine in Vercel

**To fix:**
1. Fix the error locally: `npm run build`
2. Commit and push: `git push origin main`
3. Vercel will auto-redeploy

---

## Step 4: Verify Deployment (2 minutes)

### 4.1 Get Your Production URL

1. When deployment succeeds, you'll see:
   ```
   ✅ Production
   https://event-eats-[random].vercel.app
   ```

2. Click the URL to open your live site in browser
3. You should see: **"Event Eats - Setup Completed!"** home page

### 4.2 Test Key Functionality

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Verify no errors appear
4. Try navigating (if you have other pages)

### 4.3 Check Deployment Domains

1. Go back to **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Domains**
4. You should see your deployment URL
5. (Optional) Add custom domain here (not needed for now)

---

## Step 5: Update Supabase Redirect URLs (2 minutes)

Now that you have your production URL, Vercel can properly redirect auth flows:

### 5.1 Find Your Production URL

Copy it from Vercel (e.g., `https://event-eats-abc123.vercel.app`)

### 5.2 Update Supabase Settings

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select project: **MF_booking-system**
3. Go to **Authentication** → **Settings** → **Redirect URLs**
4. Update/add your production URL:
   - Development: `http://localhost:5173`
   - Production: `https://event-eats-abc123.vercel.app` (your actual URL)
   - Click **Save**

---

## Step 6: Enable Preview Deployments (Optional but Recommended)

This lets you test changes before merging to main:

1. In Vercel project: **Settings** → **Git**
2. Under "Deploy Hooks", make sure:
   - ✅ "Comments on Pull Requests" is enabled
   - This auto-creates preview URLs for each PR

---

## ✅ Success Indicators

You'll know everything worked when:

- ✅ Vercel shows green checkmark on Production deployment
- ✅ Your production URL loads the home page
- ✅ No console errors in browser DevTools
- ✅ Supabase redirect URLs are configured
- ✅ Environment variables are set (you can edit in Vercel settings to verify)

---

## 🚀 Continuous Deployment Workflow

After initial setup, deployments are automatic:

```
1. Make changes locally
2. Run: git add . && git commit -m "..." && git push origin main
3. GitHub notifies Vercel
4. Vercel automatically builds and deploys
5. Check Deployments tab to see build progress
6. Once green ✅, your changes are live!
```

---

## 🔄 Redeploy Production

If you need to redeploy without code changes:

### Option A: From Vercel Dashboard (Easiest)
1. Go to your project's **Deployments** tab
2. Find the Production deployment
3. Click **...** (menu)
4. Select **Redeploy**
5. Wait for new build

### Option B: Via Git Push (Cleanest)
```bash
git push origin main
```
This triggers Vercel to rebuild and redeploy.

### Option C: From Preview (For PRs)
If you're testing a feature branch:
1. Create pull request
2. Vercel creates preview URL (linked in PR)
3. Test the preview
4. When ready, merge to main → auto-deploys to production

---

## 🛠️ Common Issues & Solutions

### Issue: "Build failed" in Vercel

**Most likely causes:**
1. Environment variables not set → Go to Settings → Environment Variables
2. Missing dependencies → Run `npm install` locally first
3. Syntax error in code → Check build logs for line number

**Fix:**
```bash
# Local
npm run build  # This will show the exact error

# Then fix, commit, and push
git push origin main
```

### Issue: Blank page or 404 in browser

**Causes:**
- Build succeeded but app is broken
- Environment not loaded properly
- Browser cache issue

**Fix:**
1. Hard refresh browser: `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)
2. Open DevTools (F12) → Console tab
3. Look for red errors (e.g., "Cannot find Supabase URL")
4. If using env vars, check Supabase dashboard connection

### Issue: Changes not showing up after push

**This might be:**
- Vercel still building (wait 2-3 min)
- Browser cache (hard refresh: Ctrl+Shift+R)
- Previous deployment still active

**Fix:**
1. Check Vercel Deployments tab - is there a green ✅?
2. Click the URL to force reload
3. If still not working, manually redeploy

### Issue: "VITE_SUPABASE_URL is undefined"

**Cause:** Environment variable not set in Vercel

**Fix:**
1. Go to Vercel Settings → Environment Variables
2. Make sure `VITE_SUPABASE_URL` is there
3. If not, add it
4. Redeploy
5. ⚠️ Make sure it starts with `VITE_` for frontend access!

---

## 🔐 Security Checklist

- ✅ `.env.local` is in `.gitignore` (never committed)
- ✅ Secrets are only in Vercel Settings (not in code)
- ✅ GitHub Secrets are configured (backup layer)
- ✅ Service Role Key is secret-only (not in public deployments)
- ✅ HTTPS is automatic on Vercel (all deployments use HTTPS)

---

## 📊 Monitoring & Analytics

Once deployed, monitor your site:

1. **Vercel Analytics** (Optional premium):
   - Go to Project → Analytics
   - Tracks page views, response times, etc.

2. **Function Logs** (for Edge Functions):
   - Settings → Functions
   - View real-time logs

3. **Build Time**:
   - Deployments tab shows build duration
   - Typical build: 1-2 minutes

---

## Next Steps

✅ After successful deployment:

1. **Backend Setup Phase (Phase 4)**
   - Create auth hooks
   - Migrate Order page
   - Test end-to-end

2. **Payment Integration (Phase 5)**
   - Stripe API keys
   - Create checkout flow
   - Webhooks

3. **Testing & Launch (Phase 6)**
   - UAT testing
   - Production database
   - Custom domain (if needed)

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Your Project Deployments: https://vercel.com/dashboard/event-eats (or your project name)
- Vercel Docs: https://vercel.com/docs
- Build Logs: In Vercel → Deployments → [deployment] → Logs
- GitHub Repository: https://github.com/Mbaldek/MF_booking-system

---

**Questions?** Check:
- Build errors in Vercel Logs
- SETUP_DEPLOYMENT.md for full setup context
- GITHUB_SECRETS.md for credential issues

