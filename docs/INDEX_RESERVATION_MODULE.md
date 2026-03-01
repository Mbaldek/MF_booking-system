# 🍽️ Restaurant Reservation Module — Complete Documentation Index

## 📚 Documentation Files

Ce dossier contient la documentation complète du module de réservation de restaurant pour Maison Félicien.

### **Core Documentation**

| Fichier | Description | Pour qui ? |
|---------|-------------|-----------|
| [RESERVATION_README.md](RESERVATION_README.md) | Vue d'ensemble complète + setup | Tous |
| [DATABASE_SCHEMA_COMPLETE.md](DATABASE_SCHEMA_COMPLETE.md) | Schéma BD détaillé + requêtes SQL | Devs DB |
| [RESERVATION_MOCKUPS.jsx](RESERVATION_MOCKUPS.jsx) | Maquettes UX/UI (React) | Designers, Devs Frontend |
| [RESERVATION_RESEND_SETUP.md](RESERVATION_RESEND_SETUP.md) | Intégration email + templates | Devs Backend |
| [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) | Guide déploiement production | DevOps, Lead Dev |

---

## 🎯 Quick Start (5 minutes)

### Pour **Product Owner / Manager**
1. Lire [RESERVATION_README.md](RESERVATION_README.md) section "Vue d'ensemble"
2. Consulter [RESERVATION_MOCKUPS.jsx](RESERVATION_MOCKUPS.jsx) pour visualiser screens
3. Vérifier "À Compléter" pour l'ordre de priorité

### Pour **Frontend Developer**
1. Vérifier les files créées :
   - `src/pages/ReservationPage.jsx` (funnel)
   - `src/pages/admin/AdminRestaurant.jsx` (admin panel)
   - `src/hooks/useReservation.js` (queries)
2. Lancer en local : `npm run dev`
3. Tester `/reservation/:eventId` avec event ID valide

### Pour **Backend Developer**
1. Lire [DATABASE_SCHEMA_COMPLETE.md](DATABASE_SCHEMA_COMPLETE.md)
2. Appliquer migration : `supabase/migrations/010_reservations.sql`
3. Implémenter `api/send-reservation-email.js` (voir [RESERVATION_RESEND_SETUP.md](RESERVATION_RESEND_SETUP.md))

### Pour **Devops / Deployment**
1. Lire [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) complet
2. Ajouter env vars Resend
3. Appliquer migration prod DB
4. Deploy et tester

---

## 📂 File Structure

```
src/
├── pages/
│   ├── ReservationPage.jsx              ← Funnel public (4 étapes)
│   └── admin/
│       └── AdminRestaurant.jsx          ← Back-office admin
├── hooks/
│   └── useReservation.js                ← React Query hooks
├── App.jsx                              ← Routes /reservation, /admin/restaurant
└── components/layout/
    └── AdminLayout.jsx                  ← Nav bar updated

supabase/
└── migrations/
    └── 010_reservations.sql             ← BD schema

docs/
├── RESERVATION_README.md                ← Vue d'ensemble générale
├── DATABASE_SCHEMA_COMPLETE.md          ← Schéma DB détaillé
├── RESERVATION_MOCKUPS.jsx              ← Maquettes UX/UI
├── RESERVATION_RESEND_SETUP.md          ← Email integration
├── DEPLOYMENT_VERCEL.md                 ← Déploiement
└── INDEX.md                             ← Ce fichier

api/
└── send-reservation-email.js            ← À créer (Resend)
```

---

## 🏗️ Architecture Overview

```
User Flow:
  Public URL → /reservation/:eventId
    ↓
  React App (ReservationPage.jsx)
    ├─ useShifts, useTours, useTables hooks
    └─ Guest fills form (4 steps)
    ↓
  Submit → createReservation mutation
    ↓
  Supabase INSERT reservations
    ↓
  API call → /api/send-reservation-email
    ↓
  Resend email service
    ↓
  Client email (MF branding)

Admin Flow:
  /admin/restaurant
    ├─ Manage floors (plans de salle)
    ├─ Manage tables
    ├─ Manage shifts (midi/soir)
    └─ Manage tours (créneaux horaires)
```

---

## 🚀 Implementation Timeline

### **Phase 1: MVP (1-2 weeks)**
- [x] Database schema + migration
- [x] React hooks (CRUD)
- [x] Reservation form (4 steps)
- [x] Admin panel (basic)
- [x] Resend email template
- [ ] **TODO: Deploy to prod**
- [ ] Test end-to-end
- [ ] Fix bugs

### **Phase 2: Polish (1 week)**
- [ ] Mobile optimization
- [ ] Accessibility audit
- [ ] Performance tuning
- [ ] Email template refinements
- [ ] Analytics tracking

### **Phase 3: Advanced (future)**
- [ ] Interactive seating SVG
- [ ] Real-time availability
- [ ] Admin reports/exports
- [ ] Cancellation flow
- [ ] Reminder emails

---

## 📋 Checklist d'Implémentation

### Database ✓
- [x] Migration SQL créée (010_reservations.sql)
- [x] Tables définies (floors, tables, shifts, tours, reservations)
- [x] Indices créés
- [ ] **TODO: Apply migration to prod DB**

### Frontend ✓
- [x] ReservationPage.jsx (4 steps UI)
- [x] AdminRestaurant.jsx (CRUD)
- [x] useReservation.js (hooks)
- [x] Routes intégrées dans App.jsx
- [x] Design brand MF appliqué

### Email ✓
- [x] Template HTML (Resend)
- [x] Guide d'intégration
- [ ] **TODO: Create api/send-reservation-email.js**

### Deployment
- [ ] Environment variables Resend
- [ ] Deploy code changes
- [ ] Test production
- [ ] Monitor errors

### Admin Features
- [x] Plan de salle (CRUD)
- [x] Shifts & Tours (CRUD)
- [ ] **TODO: Table occupancy status**
- [ ] **TODO: Export reservations**

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] React component renders
- [ ] Form validation works
- [ ] Hooks fetch data correctly
- [ ] Mutations save to DB

### Integration Tests
- [ ] Full flow: select shift → table → form → submit
- [ ] Email sent after submit
- [ ] Reservation appears in admin
- [ ] Admin can manage data

### E2E Tests (Cypress/Playwright)
- [ ] User completes reservation
- [ ] Email arrives
- [ ] Data persists after refresh

### Manual Testing
- [ ] Mobile (iOS/Android)
- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Accessibility (keyboard nav, screen reader)
- [ ] Performance (network throttle)

---

## 🔗 Key Components & Hooks

### React Components
- `ReservationPage.jsx` – Main funnel (public)
- `AdminRestaurant.jsx` – Admin panel
- Various form inputs, buttons, cards

### Custom Hooks (useReservation.js)
```javascript
useFloors(eventId)
useCreateFloor()
useTables(floorId)
useCreateTable()
useShifts(eventId)
useCreateShift()
useTours(shiftId)
useCreateTour()
useReservations(tourId)
useCreateReservation()
```

### Database Queries
See [DATABASE_SCHEMA_COMPLETE.md](DATABASE_SCHEMA_COMPLETE.md) for all queries

---

## 💬 API Endpoints

### Public
```
GET  /api/shifts/:eventId          ← Fetch shifts
GET  /api/tours/:shiftId           ← Fetch tours
GET  /api/tables/:floorId          ← Fetch tables
POST /api/send-reservation-email   ← Send confirmation email
```

### Admin
```
POST /api/floors                   ← Create floor
DELETE /api/floors/:id             ← Delete floor
POST /api/tables                   ← Create table
DELETE /api/tables/:id             ← Delete table
```

*(Currently handled via React Query directly to Supabase)*

---

## 🎨 Design System

### Colors (Tailwind MF)
- `mf-rose` – Primary CTA, highlights
- `mf-vieux-rose` – Hover/active
- `mf-marron-glace` – Text headings
- `mf-muted` – Secondary text
- `mf-poudre` – Subtle backgrounds
- `mf-blanc-casse` – Page background

### Typography
- **Headings**: `font-serif italic`
- **Body**: `font-body regular`
- **Small**: `text-xs text-mf-muted`

### Spacing & Radius
- `rounded-card` – Consistent border radius
- `gap-2` to `gap-6` – Standard gaps
- `p-4` to `p-8` – Padding consistency

---

## 🔒 Security Notes

- Email validation on form + API
- RLS policies on Supabase
- Rate limiting on email API (optional)
- No sensitive data logged
- Resend API key server-only

---

## 📞 Support & Questions

### Where to look first?
1. **"How does it work overall?"** → [RESERVATION_README.md](RESERVATION_README.md)
2. **"What tables exist?"** → [DATABASE_SCHEMA_COMPLETE.md](DATABASE_SCHEMA_COMPLETE.md)
3. **"How does UI look?"** → [RESERVATION_MOCKUPS.jsx](RESERVATION_MOCKUPS.jsx)
4. **"How to send emails?"** → [RESERVATION_RESEND_SETUP.md](RESERVATION_RESEND_SETUP.md)
5. **"How to deploy?"** → [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md)

---

## 📈 Next Steps

1. **Review** these docs with team
2. **Clarify** any design/flow questions
3. **Create** `api/send-reservation-email.js`  
4. **Test** locally with sample data
5. **Deploy** to production
6. **Monitor** Resend/Supabase logs
7. **Iterate** based on user feedback

---

## 🎉 Success Metrics

Once deployed, measure:
- Reservation creation time (<100ms)
- Email delivery rate (target >99%)
- Mobile bounce rate (<20%)
- Admin ease-of-use feedback
- Zero 5XX errors

---

**Last Updated**: March 2026  
**Module**: Restaurant Reservation v1.0  
**Status**: Ready for Implementation  

---
