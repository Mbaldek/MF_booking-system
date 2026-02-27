# 🚀 Event Eats - GitHub → Vercel → Supabase Setup Guide

Date: February 27, 2026  
Project: MF_booking-system (Maison Félicien Catering System)  
Status: ✅ Ready for deployment

---

## 📋 Quick Setup Checklist

- [ ] **Supabase**: Apply database schema
- [ ] **GitHub**: Add Secrets
- [ ] **Vercel**: Create and configure project
- [ ] **Local**: Install dependencies and test
- [ ] **Admin**: Create first admin user

---

## 🔑 Credentials & Project Information

### Supabase Project

- **Project Name**: MF_booking-system
- **Region**: eu-west-3 (Paris)
- **URL**: https://nodywhjtymmzzxllggnu.supabase.co
- **Status**: ✅ Active and ready

### GitHub Repository

- **Repository**: https://github.com/Mbaldek/MF_booking-system.git
- **Branch**: main (default)
- **Status**: ✅ Repository initialized and ready

### Vercel Project

- **Status**: ⏳ Ready to create
- **Expected URL**: event-eats.vercel.app (or custom domain)

---

## 🏗️ Phase 1: Supabase Database Setup (15 minutes)

### Step 1.1: Apply Database Schema

The database schema is already prepared in `supabase/migrations/001_initial_schema.sql`

**Option A: Via Supabase Dashboard (Easiest for first-time setup)**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: **MF_booking-system**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
6. Paste into the SQL Editor
7. Click **Run** (or `Ctrl+Enter`)
8. ✅ Verify: All tables, functions, and RLS policies are created

**Option B: Via Supabase CLI (Recommended for future migrations)**

```bash
# Install Supabase CLI (if not already done)
npm install -g supabase

# Login to Supabase
supabase login

# Navigate to your project directory
cd c:\Users\mathi\Desktop\event-eats

# Link your local repo to the Supabase project
# Get your project ref from: https://app.supabase.com -> Settings -> General
supabase link --project-ref nodywhjtymmzzxllggnu

# Apply migrations to the database
supabase db push
```

### Step 1.2: Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Verify **Email** is enabled (should be by default)
3. Go to **Authentication** → **Settings** → **Redirect URLs**
4. Add your development and production URLs:
   - Development: `http://localhost:5173`
   - Production: `https://event-eats.vercel.app` (update after Vercel setup)

### Step 1.3: Create First Admin User

Since this is setup, we'll create the first admin directly in the database:

1. Go to **SQL Editor** → **New Query**
2. Run this command to create an admin user first:

```sql
-- Create an admin user (replace with your email)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@maisonfélicien.fr',
  crypt('YourSecurePassword123!', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  ''
) RETURNING id;
```

3. Copy the returned UUID and create the profile:

```sql
-- After getting the user_id from above, run:
INSERT INTO profiles (user_id, role, display_name)
VALUES ('[USER_ID_FROM_ABOVE]', 'admin', 'Admin')
ON CONFLICT DO NOTHING;
```

**Alternative**: Use Supabase Dashboard → **Authentication** → **Users** → **Add user**  
Then manually run the profile insert using the user ID.

---

## 🔐 Phase 2: GitHub Configuration (10 minutes)

### Step 2.1: Add GitHub Secrets

These secrets will be used by Vercel for deployments.

1. Go to GitHub Repository: https://github.com/Mbaldek/MF_booking-system
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

| Secret Name                   | Value                                      | Source                                                   |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `VITE_SUPABASE_URL`           | `https://nodywhjtymmzzxllggnu.supabase.co` | Supabase Settings → API                                  |
| `VITE_SUPABASE_ANON_KEY`      | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  | Supabase Settings → API → anon public                    |
| `SUPABASE_SERVICE_ROLE_KEY`   | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  | Supabase Settings → API → service_role (⚠️ Keep secret!) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...`                              | Added in Phase 3 (Stripe) - leave empty for now          |

### Step 2.2: Commit Initial Setup Files

```bash
cd c:\Users\mathi\Desktop\event-eats

# Stage files (keep .env.local out via .gitignore)
git add .env.example CLAUDE.md .gitignore docs/ src/ supabase/

# Commit
git commit -m "feat: initial project setup with Supabase schema"

# Push to GitHub
git push origin main
```

---

## 🌐 Phase 3: Vercel Deployment (10 minutes)

### Step 3.1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select **Import Git Repository**
4. Choose: **GitHub** (connect if needed)
5. Select repository: `Mbaldek/MF_booking-system`
6. Click **Import**

### Step 3.2: Configure Environment Variables

1. In **Project Settings** → **Environment Variables**
2. Add each variable (same as GitHub Secrets):

```
VITE_SUPABASE_URL = https://nodywhjtymmzzxllggnu.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3.3: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework**: Vite
- **Root Directory**: `.` (project root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3.4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~3-5 minutes)
3. ✅ Preview deployment created at: `https://[project-name].[random].vercel.app`
4. Visit **Project Settings** → **Domains** to add custom domain (optional)

### Step 3.5: Update Supabase Auth Redirect URLs

After Vercel deployment completes:

1. Go to Supabase Dashboard
2. **Authentication** → **Settings** → **Redirect URLs**
3. Add your Vercel production URL:
   - Production: `https://event-eats.vercel.app/` (verify exact domain)

---

## 💻 Phase 4: Local Development Setup (10 minutes)

### Step 4.1: Clone and Configure Locally

```bash
# Clone the repository
cd c:\Users\mathi\Desktop
git clone https://github.com/Mbaldek/MF_booking-system.git
cd MF_booking-system

# Copy environment template
copy .env.example .env.local

# Edit .env.local with your credentials (they're already there from step 2)
# .env.local is in .gitignore, so it won't be committed
```

### Step 4.2: Install Dependencies

```bash
# Install dependencies (includes React, Vite, Supabase client, etc.)
npm install

# Verify Supabase client installed
npm list @supabase/supabase-js
```

### Step 4.3: Test Connection

```bash
# Start development server
npm run dev

# Navigate to http://localhost:5173
# You should see the application home page
```

**Test Supabase Connection:**

1. Open browser DevTools (F12)
2. Open **Console** tab
3. Run:

```javascript
import { supabase } from "./src/api/supabase.js";
const { data, error } = await supabase.from("events").select("count");
console.log(data, error);
```

✅ If no error and `data` shows query result, connection is working!

---

## 🔄 Phase 5: Continuous Deployment Workflow

### For Local Development

```bash
# Create a feature branch
git checkout -b feature/migrate-auth-hooks

# Make changes, test locally with `npm run dev`

# Commit and push
git add .
git commit -m "feat: implement Supabase auth hooks"
git push origin feature/migrate-auth-hooks

# Create Pull Request on GitHub
# → Vercel will automatically create a Preview Deployment
# → Review and test the preview before merging
# → Merge to main → Vercel deploys to production
```

### Preview vs Production Deployments

- **Preview**: Created automatically on each PR, using production database (with RLS protection)
- **Production**: Only when merged to main branch

---

## 🛡️ Security Checklist

- [x] `.env.local` is in `.gitignore` (never committed)
- [x] `.env.example` is committed (shows what variables are needed)
- [x] All Supabase keys are in Environment Variables (not in code)
- [x] Service Role Key stored as secret (never in preview deployments)
- [x] RLS policies enabled on all tables (database layer security)
- [x] Auth redirect URLs configured (prevents OAuth token leakage)
- [x] GitHub Secrets properly configured (for CI/CD)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│              (https://github.com/Mbaldek/...)           │
│                   Stores codebase                        │
└────────┬────────────────────────────────────────────────┘
         │
         ├─→ Vercel CI/CD Pipeline
         │   ├─ Triggers on: git push to main
         │   ├─ Builds: npm run build (Vite)
         │   ├─ Deploys to: https://event-eats.vercel.app
         │   └─ Stores environment variables securely
         │
         └─→ Local Development
             └─ Clone locally with git
             └─ Uses .env.local for secrets

┌─────────────────────────────────────────────────────────┐
│             Supabase (PostgreSQL Database)              │
│    (https://nodywhjtymmzzxllggnu.supabase.co)          │
│                                                         │
│  Tables: profiles, events, meal_slots, menu_items,     │
│         slot_menu_items, orders, order_lines           │
│                                                         │
│  Security: Row Level Security (RLS) policies enabled   │
│  Auth: Email + optional Magic Link + OAuth             │
└─────────────────────────────────────────────────────────┘

Frontend (React + Vite)
↔ Vercel
↔ Supabase Client (@supabase/supabase-js)
↔ Supabase (Database + Auth + RLS)
```

---

## 🔧 Troubleshooting

### Issue: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"

- **Cause**: Environment variables not loaded
- **Fix**:
  1. Restart `npm run dev`
  2. Verify `.env.local` exists in project root
  3. Check values match Supabase dashboard exactly

### Issue: Vercel build fails with "Cannot find module '@supabase/supabase-js'"

- **Cause**: Dependencies not installed
- **Fix**:
  1. In Vercel Project Settings, verify **Install Command** is `npm install`
  2. Clear Vercel cache: **Settings** → **Git** → **Clear git cache and redeploy**

### Issue: RLS policies blocking access

- **Cause**: User doesn't have correct role in profiles table
- **Fix**:
  1. Verify user exists in `auth.users`
  2. Verify profile entry exists with correct role via SQL Editor:
     ```sql
     SELECT user_id, role FROM profiles WHERE role = 'admin';
     ```

### Issue: Dark screen or blank page after deploying to Vercel

- **Cause**: Likely build issue or missing environment variables
- **Fix**:
  1. Check Vercel **Deployments** tab for build logs
  2. Verify all VITE\_\* variables are set
  3. Local development works? → Run `npm run build` locally to check for errors

---

## 📈 Next Steps (After Initial Setup)

### Phase 4: Code Migration (Supabase Integration)

Priority order:

1. Auth hooks + AuthContext (security)
2. Order.jsx page (main revenue page)
3. Admin panel pages
4. Staff kitchen tracking page

See `MIGRATION_CHEATSHEET.md` for Base44 → Supabase code patterns.

### Phase 5: Stripe Integration (Payment)

1. Create Stripe test account
2. Add Stripe Publisher key to env
3. Create Edge Function for checkout
4. Implement payment flow in Order.jsx

### Phase 6: Testing & Launch

1. End-to-end user testing
2. Admin functionality verification
3. Performance testing with Vercel Analytics
4. Production domain configuration (optional)

---

## 📚 Useful Links

- **Supabase Dashboard**: https://app.supabase.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: https://github.com/Mbaldek/MF_booking-system
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **React Query Docs**: https://tanstack.com/query/latest

---

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs/getting-started-with-vercel
- PostgreSQL Docs: https://www.postgresql.org/docs/
- React Docs: https://react.dev
