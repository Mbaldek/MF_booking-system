# Event Eats - Maison Félicien Catering Booking System

[![GitHub](https://img.shields.io/badge/GitHub-Mbaldek%2FMF_booking--system-blue?logo=github)](https://github.com/Mbaldek/MF_booking-system)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-000?logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple?logo=vite)](https://vitejs.dev)

## 🎯 Project Overview

**Event Eats** is a modern web application for managing meal reservations during events (conferences, expos, congresses). Clients can browse menus, place orders, and make payments. Staff can track meal preparation and delivery.

### Key Features
- 🛒 **Customer Ordering**: Intuitive meal selection interface
- 📅 **Event Management**: Multiple day support with lunch/dinner differentiation
- 💳 **Payment Integration**: Stripe checkout for secure payments
- 🍳 **Kitchen Tracking**: Real-time preparation status per meal
- 📱 **Responsive Design**: Mobile-first UI with Tailwind CSS
- 🔐 **Security**: Row-level security (RLS) with role-based access control

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+
- Git
- GitHub account
- Supabase account (free tier available)
- Vercel account (free tier available)

### Option 1: Deploy to Vercel (Recommended)

1. **Read Quick Start**:
   ```bash
   # View one-page deploy checklist
   cat QUICK_START.md
   ```

2. **Follow the 3-phase deployment**:
   - Phase 1: Supabase (15 min)
   - Phase 2: GitHub Secrets (10 min)
   - Phase 3: Vercel Deployment (10 min)

3. **Done!** Your app is live at `https://event-eats-[random].vercel.app`

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/Mbaldek/MF_booking-system.git
cd MF_booking-system

# Install dependencies
npm install

# Create .env.local (template: .env.example)
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Open http://localhost:5173
```

---

## 📚 Documentation

| Document | Purpose | Time |
|----------|---------|------|
| **[QUICK_START.md](./QUICK_START.md)** | One-page deployment checklist | 2 min |
| **[SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md)** | Complete setup guide with all phases | 15 min |
| **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** | Detailed Vercel deployment + troubleshooting | 15 min |
| **[GITHUB_SECRETS.md](./GITHUB_SECRETS.md)** | GitHub Secrets configuration guide | 10 min |
| **[CLAUDE.md](./CLAUDE.md)** | Project architecture & conventions | 10 min |
| **[MIGRATION_CHEATSHEET.md](./docs/MIGRATION_CHEATSHEET.md)** | Base44 → Supabase code patterns | 5 min |

---

## 🏗️ Architecture

### Tech Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite 6 + Tailwind CSS | UI & user interactions |
| **UI Components** | shadcn/ui + Radix UI | Accessible components |
| **State Management** | TanStack React Query | Server state sync |
| **Database** | Supabase (PostgreSQL) | Data persistence |
| **Authentication** | Supabase Auth | User management |
| **Payment** | Stripe Checkout | Secure payments |
| **Hosting** | Vercel | Frontend deployment |

### Data Model

```
Events (salons/conferences)
├── Meal Slots (lunch/dinner per day)
│   ├── Menu Items (dishes)
│   └── Slot Menu Items (dishes available at this slot)
└── Orders (customer reservations)
    └── Order Lines (individual items with prep status)

Profiles (users with roles: admin, staff, customer)
```

### Key Concepts

- **Orders** = Financial view (total amount, payment status)
- **Order Lines** = Admin view (individual dishes, prep statuses)
- **RLS Policies** = Database-level security by role

---

## 🔄 Current Project Status

### ✅ Completed (Setup Phase)
- [x] GitHub repository initialized and code pushed
- [x] Supabase project created with schema prepared
- [x] Environment variables configured (.env.local + .env.example)
- [x] Package.json with all dependencies
- [x] Vite + Tailwind CSS setup
- [x] RLS policies and database triggers configured
- [x] Documentation completed

### ⏳ Next Steps (Development Phases)

**Phase 1: Supabase Deployment** (Day 1)
- [ ] Apply database schema to Supabase
- [ ] Configure GitHub Secrets
- [ ] Deploy frontend to Vercel
- [ ] Verify production environment

**Phase 2: Auth Migration** (Day 2-3)
- [ ] Create `useAuth.js` hook
- [ ] Migrate AuthContext from Base44 to Supabase
- [ ] Implement role-based access control
- [ ] Test login flows

**Phase 3: Order Page Migration** (Day 3-4)
- [ ] Migrate `Order.jsx` to use Supabase
- [ ] Update event/menu loading
- [ ] Test order creation flow
- [ ] End-to-end testing

**Phase 4: Admin Pages** (Day 4-5)
- [ ] Migrate admin dashboard
- [ ] Implement kitchen tracking UI
- [ ] Implement delivery tracking
- [ ] User & role management

**Phase 5: Payment Integration** (Day 5-6)
- [ ] Stripe API setup
- [ ] Create checkout Edge Function
- [ ] Implement payment flow in Order page
- [ ] Webhook for payment confirmation

**Phase 6: Launch & Testing** (Day 6-7)
- [ ] UAT with stakeholders
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start local dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build locally

# Linting (optional)
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Database (with Supabase CLI)
supabase db push         # Apply migrations
supabase functions serve # Run Edge Functions locally
```

---

## 🔐 Environment Configuration

### Local Development (.env.local)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # For admin operations
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_  # Phase 5
```

### Vercel Cloud (Environment Variables)
Same variables configured in Vercel Settings → Environment Variables

### GitHub Secrets (CI/CD)
Used by Vercel during build: same 3 main secrets

⚠️ **Never commit `.env.local`** — It's in `.gitignore`

---

## 📊 Project Structure

```
event-eats/
├── docs/                          # Documentation & reference code
│   ├── original-base44/           # Legacy Base44 code (reference)
│   ├── MIGRATION_CHEATSHEET.md    # Code migration patterns
│   └── diagnostic-event-eats.md   # Project analysis
├── src/
│   ├── api/
│   │   └── supabase.js            # Supabase client config
│   ├── hooks/                     # Custom React hooks (to be created)
│   │   ├── useAuth.js             # Authentication
│   │   ├── useEvents.js           # Events CRUD
│   │   ├── useOrders.js           # Orders CRUD
│   │   └── ...
│   ├── lib/
│   │   ├── AuthContext.jsx        # Auth provider (to be migrated)
│   │   └── RoleGuard.jsx          # Route protection (to be created)
│   ├── components/
│   │   ├── order/                 # Customer order components
│   │   ├── kitchen/               # Staff kitchen components
│   │   ├── invoice/               # Invoice generation
│   │   └── ui/                    # shadcn/ui components
│   ├── pages/                     # Page components (to be migrated)
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles (Tailwind)
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Database schema
│   └── functions/                 # Edge Functions (Stripe, etc.)
├── public/                        # Static assets
├── .env.example                   # Template for env variables
├── .env.local                     # Local secrets (not committed)
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tailwind.config.js             # PostCSS configuration
├── index.html                     # HTML entry point
├── QUICK_START.md                 # Quick deployment checklist
├── SETUP_DEPLOYMENT.md            # Complete setup guide
├── VERCEL_SETUP.md                # Vercel deployment guide
├── GITHUB_SECRETS.md              # GitHub Secrets guide
├── CLAUDE.md                      # Project context & conventions
└── README.md                      # This file
```

---

## 🚀 Deployment

### GitHub → Vercel → Supabase Flow

```
1. Push to GitHub (main branch)
           ↓
2. Vercel webhook triggered
           ↓
3. Vercel pulls GitHub Secrets
           ↓
4. Build: npm install → npm run build
           ↓
5. Deploy to Vercel CDN
           ↓
6. Frontend calls Supabase API
           ↓
7. Supabase applies RLS policies
           ↓
8. User sees live app with their auth level
```

### Automatic Redeploy on Code Changes
- Any push to `main` branch → Auto-redeploys to production
- Pull requests → Auto-create preview deployments (if enabled)

---

## 🔑 Key Credentials

**Stored in:**
- ✅ `.env.local` (local dev) — DO NOT COMMIT
- ✅ Vercel Settings → Environment Variables (production)
- ✅ GitHub Secrets (backup/CI-CD)

**Never hardcode in source files!**

See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for complete credential setup.

---

## 🛡️ Security Approach

### Database Security (Supabase RLS)
- Row-level security policies enforced at DB level
- Customers see only their orders
- Staff see assigned event orders
- Admin sees everything

### Application Security
- Auth via Supabase (email + JWT)
- Environment variables for sensitive keys
- Role checks on pages and API calls
- HTTPS enforced everywhere

### Deployment Security
- GitHub Secrets encrypted
- Vercel secrets isolated per environment
- Service role key stored separately
- No secrets in source code

---

## 🐛 Troubleshooting

### Build Fails on Vercel
1. Check Vercel build logs (Deployments tab)
2. Run locally: `npm run build` to reproduce error
3. Fix and push: `git push origin main`
4. See [VERCEL_SETUP.md](./VERCEL_SETUP.md#-common-issues--solutions)

### Environment Variables Issues
1. Verify `.env.local` exists locally
2. Check Vercel Settings → Environment Variables
3. See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md#troubleshooting)

### Supabase Connection Errors
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
2. Check Supabase API keys haven't expired
3. See [SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md#troubleshooting)

---

## 📈 Next: Code Migration Path

After deployment verification, start Phase 2:

1. **Read migration patterns**: `docs/MIGRATION_CHEATSHEET.md`
2. **Create auth hooks**: See `CLAUDE.md` for hook structure
3. **Migrate pages**: Start with `Order.jsx` (main revenue page)
4. **Test with Supabase**: Each page should use hooks instead of Base44

---

## 🤝 Contributing

This is a team project. When making changes:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Push: `git push origin feature/your-feature`
4. Create Pull Request on GitHub
5. Vercel creates preview URL automatically
6. Team reviews and tests
7. Merge to main → auto-deploys

---

## 📞 Support & Documentation Links

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **GitHub Issues**: https://github.com/Mbaldek/MF_booking-system/issues

---

## 📋 License

This project is proprietary to Maison Félicien. All rights reserved.

---

## ✨ Project Timeline

| Date | Milestone |
|------|-----------|
| Feb 27, 2026 | Project setup complete, GitHub/Supabase ready |
| Feb 28, 2026 | Vercel deployment completed |
| Mar 1-2, 2026 | Auth migration & role-based access |
| Mar 2-3, 2026 | Order page migration (main feature) |
| Mar 4-5, 2026 | Admin pages & staff tracking |
| Mar 5-6, 2026 | Stripe payment integration |
| Mar 6-7, 2026 | Testing & launch |

---

**Last Updated**: February 27, 2026  
**Project Status**: ✅ Setup Phase Complete  
**Next Phase**: 🚀 Production Deployment

