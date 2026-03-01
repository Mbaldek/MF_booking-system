# Module Réservation Restaurant — Maison Félicien

## 📋 Vue d'ensemble

Module complet permettant aux convives d'**une événement** de réserver une table via un funnel public simple et épuré, sans paiement (confirmation email uniquement).

```
Flow Utilisateur:
1. Accueil (landing)
2. Choix service (midi/soir) + créneau (slots 30min)
3. Sélection table (plan visuel)
4. Informations client (nom, email, couverts)
5. Confirmation (succès + récap)
```

---

## 🏗️ Architecture

### **Base de Données** (Supabase)

Nouvelle migration `010_reservations.sql` avec tables :

- **`restaurant_floors`** – Plans de salle (Ex: "Salle principale", "Terrasse")
- **`restaurant_tables`** – Tables individuelles (numéro, sièges, coordonnées optionnelles)
- **`meal_shifts`** – Services (midi, soir) avec heures et intervalle créneau (ex: 30min)
- **`meal_tours`** – Tours (Créneaux horaires) avec heure de début et durée
- **`reservations`** – Les réservations clients (guest name, email, table, seats, timestamp)

### **Frontend** (React + Tailwind)

**Fichiers créés :**

- `src/pages/ReservationPage.jsx` – Funnel complet (4 étapes)
- `src/hooks/useReservation.js` – Queries / Mutations React Query
- `src/pages/admin/AdminRestaurant.jsx` – Back-office pour gérer plans et shifts
- `docs/RESERVATION_MOCKUPS.jsx` – Maquettes UX/UI (design reference)

### **Email** (Resend)

- Fonction serveur `api/send-reservation-email.js` pour envoyer confirmations
- Template HTML stylisé avec charte Maison Félicien

### **Routes**

```
Public:
  /reservation/:eventId  → Funnel réservation

Admin:
  /admin/restaurant      → Gestion plans, shifts, tours
```

---

## ⚙️ Setup & Installation

### 1. **Mise à jour Supabase**

```bash
# Appliquer migration
psql -U postgres -d yourdb -f supabase/migrations/010_reservations.sql

# Ou depuis Vercel/Supabase Studio: copier-coller SQL dans éditeur
```

### 2. **Hooks React**

Les hooks `useReservation.js` sont déjà en place avec :
- `useFloors()`, `useCreateFloor()`
- `useTables()`, `useCreateTable()`
- `useShifts()`, `useCreateShift()`
- `useTours()`, `useCreateTour()`
- `useReservations()`, `useCreateReservation()`

### 3. **Resend Email Setup**

```bash
npm install resend
```

**Ajouter à `.env.local` :**
```
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxx  # Pour fonction serveur
```

**Voir `docs/RESERVATION_RESEND_SETUP.md` pour code complet**

### 4. **Routes App.jsx**

✅ Déjà ajoutées :
- `<Route path="/reservation/:eventId" element={<ReservationPage />} />`
- `<Route path="/admin/restaurant" element={<AdminRestaurant />} />`

---

## 🎨 UX/UI Design

### Charte Appliquée
- **Couleurs :** `mf-rose`, `mf-marron-glace`, `mf-poudre`, `mf-blanc-casse`
- **Typo :** `font-serif` (titres italiques), `font-body` (texte regular)
- **Spacing :** `rounded-card` classe Tailwind custom
- **Components :** Cards, inputs, buttons réutilisables

### Écrans Moquettés
Voir `docs/RESERVATION_MOCKUPS.jsx` pour :
- Screen 1: Welcome / Landing
- Screen 2: Shift + Tour selection
- Screen 3: Table selection (grid visuel)
- Screen 4: Guest info + form
- Screen 5: Confirmation success

---

## 🔧 Configuration Admin (AdminRestaurant.jsx)

Permet de **créer et gérer** :

### Plans de Salle
```
+ Ajouter plan (ex: "Salle principale")
  Pour chaque plan :
    - Ajouter tables (numéro, sièges)
    - Supprimer tables
```

### Shifts & Tours
```
+ Ajouter shift (ex: "Midi", "Soir")
  Heures début/fin + intervalle créneau (ex: 30min)
  Pour chaque shift :
    - Ajouter tours (ex: 12:00, 12:30, 13:00...)
    - Durée tour (ex: 45min)
```

---

## 📧 Email Template (Resend)

Le modèle `send-reservation-email.js` envoie un email avec :

```
✓ Branding Maison Félicien (header, footer, couleurs)
✓ Détails réservation (date, heure, table, couverts)
✓ Message d'accueil personnalisé
✓ Informations importantes (arriver 10min avant, annulation 24h)
✓ Contact support
```

Voir `docs/RESERVATION_RESEND_SETUP.md` pour HTML complet.

---

## 🚀 Flux Complet (User → DB → Email)

```
1. Utilisateur se connecte via /reservation/:eventId
   ↓
2. Choisit service (midi/soir) + créneau (useTours)
   ↓
3. Sélectionne table (useTables)
   ↓
4. Remplit form (nom, email, couverts)
   ↓
5. Submit → mutation createReservation() 
   ↓
6. (Success) → Appel API /api/send-reservation-email
   ↓
7. Resend envoie email à guest
   ↓
8. Screen 5 : Confirmation affichée
```

---

## 📝 À Compléter

### Court terme (MVP)
- [ ] Intégrer fonction serveur Resend (`api/send-reservation-email.js`)
- [ ] Tester flow complet avec données réelles
- [ ] Ajouter validation emails (confirmation double-opt-in?)
- [ ] Affichage visuel "tables pleines" après X réservations

### Moyen terme
- [ ] Carte SVG interactive (vs grid simple)
- [ ] Gestion disponibilités temps réel (WebSocket)
- [ ] Admin: exporter réservations (CSV)
- [ ] Admin: rappels email avant réservation (24h, 1h avant)

### Long terme
- [ ] Paiement optionnel (dépôt/caution)
- [ ] Notifications SMS
- [ ] QR code réservation (accès)
- [ ] Dashboard pour staff (checkin)

---

## 📁 Fichiers Clés

```
src/
├── pages/
│   ├── ReservationPage.jsx          ← Funnel public (4 étapes)
│   └── admin/
│       └── AdminRestaurant.jsx      ← Gestion plans/shifts
├── hooks/
│   └── useReservation.js            ← Queries React Query
└── App.jsx                          ← Routes intégrées

supabase/migrations/
└── 010_reservations.sql             ← Schéma DB

docs/
├── RESERVATION_MOCKUPS.jsx          ← UX/UI reference
├── RESERVATION_RESEND_SETUP.md      ← Email integration guide
└── RESERVATION_README.md            ← Ce fichier

api/
└── send-reservation-email.js        ← À créer (Resend)
```

---

## 🧪 Testing Checklist

- [ ] Admin peut créer plans de salle
- [ ] Admin peut ajouter tables avec bon nb sièges
- [ ] Admin peut créer shifts et tours
- [ ] User peut sélectionner shift/tour sans erreur
- [ ] User peut choisir table visuelle
- [ ] Form validation: email requis et valide
- [ ] Mutation `createReservation` enregistre en DB
- [ ] Email envoyé avec infos correctes
- [ ] Screen confirmation affiche tous détails
- [ ] Mobile responsive (toutes résolutions)

---

## 🎯 Notes de Conception

✓ **Flows courts** – Max 4 clics avant confirmation  
✓ **Mobile first** – Responsive design prioritaire  
✓ **Accessibilité** – Labels clairs, step indicators, +/− buttons  
✓ **Brand consistency** – Charte MF stricte appliquée  
✓ **Zero friction** – Pas d'authentification requise, pas de paiement  
✓ **One-click email** – Confirmation immédiate sans action supplémentaire  

---

## Questions / Clarifications

1. **Carte visuelle** : Voulez-vous une carte SVG interactive ou grid simple pour commencer ?
2. **Validation** : Double opt-in email ou validation simple ?
3. **Créneau** : Toujours 30min ou configurable par shift ?
4. **Overbooking** : Accepter + de réservations que sièges dispos ?

---

**Ready to test? Let's go!** 🚀
