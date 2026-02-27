# 🚀 Event Eats - Quick Start Guide

**Status:** Project setup COMPLETE ✅  
**Last Updated:** February 27, 2026  
**Next Step:** Deploy to GitHub → Supabase → Vercel

---

## 📊 Current Setup Status

| Component | Status | Details |
|-----------|--------|---------|
| **GitHub Repository** | ✅ Ready | https://github.com/Mbaldek/MF_booking-system |
| **Local Project** | ✅ Ready | All files staged and committed |
| **Supabase Project** | ✅ Ready | Database created, schema prepared |
| **Environment Setup** | ✅ Ready | .env.local configured with credentials |
| **Package.json** | ✅ Ready | All dependencies configured |
| **Documentation** | ✅ Ready | 3 comprehensive guides created |
| **Vercel Integration** | ⏳ Pending | Ready to create project |

---

## ⚡ One-Page Deployment Checklist

### Phase 1: Supabase (15 min)
```
□ Go to Supabase Dashboard (app.supabase.com)
□ Select project: MF_booking-system
□ Navigate to SQL Editor → New Query
□ Copy & paste entire content of supabase/migrations/001_initial_schema.sql
□ Click Run
□ Verify: All tables created (events, meal_slots, menu_items, orders, etc.)
□ Verify: RLS policies enabled
   SQL to check: SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 5;
□ Enable Email Auth (should be default)
□ Configure Redirect URLs:
   - Development: http://localhost:5173
   - Production: https://event-eats.vercel.app (update later)
```

### Phase 2: GitHub Secrets (10 min)
```
□ Go to GitHub: Settings → Secrets and variables → Actions
□ Click "New repository secret" × 3

1️⃣ Secret: VITE_SUPABASE_URL
   Value: https://nodywhjtymmzzxllggnu.supabase.co

2️⃣ Secret: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzExODMsImV4cCI6MjA4Nzc0NzE4M30.EI1dShtkxoElVDLKH5GyzPCFqT8EdETP_bU1zqrYyFI

3️⃣ Secret: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE3MTE4MywiZXhwIjoyMDg3NzQ3MTgzfQ.rUm5w2QlURlRCEcG_vaAEOe7v3oW5jsZGay0AO_3_6c
   ⚠️  Keep this secret!
```

### Phase 3: Vercel Deployment (10 min)
```
□ Go to Vercel Dashboard: https://vercel.com/dashboard
□ Click "Add New" → "Project"
□ Select "Import Git Repository"
□ Choose GitHub → Select Mbaldek/MF_booking-system
□ Click "Import"

Configuration:
□ Framework: Vite (auto-detected)
□ Root Directory: . (current)
□ Build Command: npm run build (auto-detected)
□ Install Command: npm install (auto-detected)

Add Environment Variables:
□ VITE_SUPABASE_URL = https://nodywhjtymmzzxllggnu.supabase.co
□ VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
□ SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

□ Click Deploy
□ Wait 3-5 minutes for build to complete
□ ✅ You have a production URL!
   Likely: https://mf-booking-system.vercel.app

After Deployment:
□ Copy your production URL
□ Go back to Supabase → Authentication → Settings → Redirect URLs
□ Add your Vercel URL: https://mf-booking-system.vercel.app
```

### Phase 4: Local Development (5 min)
```bash
# Clone the repo locally (if not already done)
cd c:\Users\mathi\Desktop
git clone https://github.com/Mbaldek/MF_booking-system.git
cd MF_booking-system

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser: http://localhost:5173
# You should see the home page with setup status
```

---

## 📚 Documentation Files

| File | Purpose | Time to Read |
|------|---------|--------------|
| **SETUP_DEPLOYMENT.md** | Complete step-by-step setup guide with all phases | 15 min |
| **GITHUB_SECRETS.md** | Detailed GitHub Secrets configuration + troubleshooting | 10 min |
| **CLAUDE.md** | Project architecture and conventions | 10 min |
| **MIGRATION_CHEATSHEET.md** | Base44 → Supabase code patterns (for Phase 4) | 5 min |

---

## 🔑 Your Credentials (Already in .env.local)

```
VITE_SUPABASE_URL=https://nodywhjtymmzzxllggnu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzExODMsImV4cCI6MjA4Nzc0NzE4M30.EI1dShtkxoElVDLKH5GyzPCFqT8EdETP_bU1zqrYyFI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE3MTE4MywiZXhwIjoyMDg3NzQ3MTgzfQ.rUm5w2QlURlRCEcG_vaAEOe7v3oW5jsZGay0AO_3_6c
```

**⚠️ NOTE**: Never commit `.env.local` to Git. It's in `.gitignore`.

---

## 🎯 Success Criteria

You'll know the setup is successful when:

1. ✅ Supabase dashboard shows all tables created
2. ✅ GitHub Secrets configuration is complete (no build errors visible)
3. ✅ Vercel deployment shows green checkmark (build successful)
4. ✅ Vercel preview/production URL works and shows home page
5. ✅ `npm run dev` locally starts without errors
6. ✅ Browser console shows no SUPABASE_URL errors

---

## 🔧 Troubleshooting Quick Links

**Vercel build fails?**
→ Check SETUP_DEPLOYMENT.md → Troubleshooting section

**GitHub Secrets errors?**
→ Check GITHUB_SECRETS.md → Emergency section

**Supabase connection issues?**
→ Check .env.local exists and has correct values

**Local dev not working?**
→ Run: `npm install` then `npm run dev`

---

## 📈 Next Phase: Code Migration

After deployment is complete and verified:

1. **Create auth hooks** (`src/hooks/useAuth.js`)
2. **Migrate Order.jsx** page to use Supabase
3. **Migrate admin pages** 
4. **Integrate Stripe** (Phase 5)

See `MIGRATION_CHEATSHEET.md` for code patterns.

---

## 🚀 Commands Reference

```bash
# Development
npm run dev              # Start local dev (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build locally

# Git
git push origin main     # Push changes to GitHub
git pull origin main     # Pull latest changes

# Supabase CLI (optional)
supabase login           # Login to Supabase
supabase db push         # Apply migrations to DB
```

---

## 📞 Key Links

- 🌐 Supabase Dashboard: https://app.supabase.com/
- 🚀 Vercel Dashboard: https://vercel.com/dashboard
- 📝 GitHub Repository: https://github.com/Mbaldek/MF_booking-system
- 💾 GitHub Issues: For bug tracking
- 📚 Project Docs: See `/docs` folder

---

**Questions?** Refer to the appropriate doc:
- Setup issues → SETUP_DEPLOYMENT.md
- Secret configuration → GITHUB_SECRETS.md
- Architecture → CLAUDE.md
- Code migration → MIGRATION_CHEATSHEET.md

