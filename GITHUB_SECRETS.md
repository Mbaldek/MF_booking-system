# 🔐 GitHub Secrets Configuration Guide

## What are GitHub Secrets?

GitHub Secrets are encrypted environment variables stored at the repository level. They're used by:
- **Vercel**: To access Supabase credentials during builds and deployments
- **CI/CD Workflows**: For automated testing and deployments
- **Security**: Values are never logged or displayed in build logs

---

## 📋 Required Secrets for Event Eats

| Secret Name | Purpose | Source | Sensitivity |
|-------------|---------|--------|-------------|
| `VITE_SUPABASE_URL` | Frontend: Connect to Supabase | Supabase Dashboard → Settings → API | 🟢 Low |
| `VITE_SUPABASE_ANON_KEY` | Frontend: Authenticate with Supabase | Supabase Dashboard → Settings → API → anon key | 🟡 Medium |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend: Full database access (⚠️ Secret!) | Supabase Dashboard → Settings → API → service_role | 🔴 HIGH |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend: Stripe payment form | Stripe Dashboard (test mode) | 🟡 Medium |

---

## 🔑 Step-by-Step: Add Secrets to GitHub

### Step 1: Get Your Supabase Credentials

1. Go to **[Supabase Dashboard](https://app.supabase.com/)**
2. Select project: **MF_booking-system**
3. Go to **Settings** → **API** (left sidebar)
4. Copy the values shown below:

**Find:**
- **Project URL** → This is `VITE_SUPABASE_URL`
- **anon public** → This is `VITE_SUPABASE_ANON_KEY`
- **service_role secret** → This is `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

```
Project URL: https://nodywhjtymmzzxllggnu.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzExODMsImV4cCI6MjA4Nzc0NzE4M30.EI1dShtkxoElVDLKH5GyzPCFqT8EdETP_bU1zqrYyFI
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE3MTE4MywiZXhwIjoyMDg3NzQ3MTgzfQ.rUm5w2QlURlRCEcG_vaAEOe7v3oW5jsZGay0AO_3_6c
```

### Step 2: Go to GitHub Secret Settings

1. Navigate to: **[GitHub Repository](https://github.com/Mbaldek/MF_booking-system)**
2. Click **Settings** (top nav)
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Step 3: Add Each Secret

Repeat for each secret below:

#### Secret 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://nodywhjtymmzzxllggnu.supabase.co`
- Click **Add secret**

#### Secret 2: VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzExODMsImV4cCI6MjA4Nzc0NzE4M30.EI1dShtkxoElVDLKH5GyzPCFqT8EdETP_bU1zqrYyFI`
- Click **Add secret**

#### Secret 3: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE3MTE4MywiZXhwIjoyMDg3NzQ3MTgzfQ.rUm5w2QlURlRCEcG_vaAEOe7v3oW5jsZGay0AO_3_6c`
- Click **Add secret**
- ⚠️ **DO NOT SHARE THIS KEY** — Keep it private!

#### Secret 4: VITE_STRIPE_PUBLISHABLE_KEY (Optional for now)
- **Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
- **Value**: `pk_test_` + your test key (add during Phase 5: Stripe integration)
- Click **Add secret**

### Step 4: Verify Secrets Added

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all secrets listed (values hidden):
   ```
   ✅ VITE_SUPABASE_URL
   ✅ VITE_SUPABASE_ANON_KEY
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ⏳ VITE_STRIPE_PUBLISHABLE_KEY (optional for Phase 1)
   ```

---

## 🔗 How Vercel Uses These Secrets

1. **User pushes to GitHub** `git push origin main`
2. **GitHub notifies Vercel** of the push
3. **Vercel triggers build** and pulls secrets from GitHub
4. **Environment variables injected** into build process:
   ```bash
   VITE_SUPABASE_URL=https://... npm run build
   ```
5. **Built application** deployed with secrets configured
6. **Application runs** with Supabase connected

---

## 🛡️ Security Best Practices

✅ **DO:**
- Keep `.env.local` local only (in `.gitignore`)
- Rotate keys periodically
- Use different keys for dev/test/production (when applicable)
- Limit access to secrets via GitHub organization permissions
- Audit secret access in GitHub logs

❌ **DON'T:**
- Commit `.env.local` to Git
- Hardcode secrets in source files
- Share secret values via Slack, email, or chat
- Use production secrets for development
- Commit `SUPABASE_SERVICE_ROLE_KEY` anywhere

---

## 🔄 Updating Secrets

If you need to rotate/update a secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Find the secret you want to update
3. Click the **Update** button (pencil icon)
4. Replace the value
5. Click **Save changes**
6. Next Vercel deployment will use the new Secret

---

## 🚨 Emergency: Secret Compromised?

If a secret is accidentally exposed:

1. **Immediately rotate in Supabase**:
   - Go to Supabase Dashboard → Settings → Regenerate API Keys
   - This invalidates the old key

2. **Update GitHub Secret**:
   - Settings → Secrets and variables → Update the secret

3. **Trigger redeploy on Vercel**:
   - Go to Vercel Deployments
   - Find the affected deployment
   - Click **Redeploy** button

---

## 📚 Reference Links

- GitHub Secrets Docs: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables
- Supabase API Keys: https://supabase.com/docs/guides/api

