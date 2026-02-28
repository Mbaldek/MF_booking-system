# CLAUDE.md — Maison Félicien · Event Booking System

> Lis ce fichier EN ENTIER avant de coder quoi que ce soit.
> Lis aussi `docs/DESIGN_SYSTEM_MF.md` et `docs/REDESIGN_BRIEF.md` pour le design.

---

## 1. Projet

Outil de réservation de commandes repas pour clients lors d'événements (salons, foires, congrès).
**Maison Félicien** — traiteur premium, service midi et soir sur plusieurs jours.

### Utilisateurs
| Rôle | Besoins |
|------|---------|
| **Client** (90% du trafic) | Commander des repas pour N jours, choisir midi/soir, payer en ligne |
| **Admin** | Gérer événements, menus, commandes, facturation, stats |
| **Staff Cuisine** | Voir les plats à préparer, avancer le pipeline par plat |
| **Staff Livraison** | Voir les commandes prêtes, confirmer livraison par stand + photo |

---

## 2. Stack technique

- **Frontend** : React 18 + Vite 6 + Tailwind CSS + shadcn/ui
- **Backend/DB** : Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Paiement** : Stripe Checkout (session via Edge Function)
- **Déploiement** : Vercel (front) + Supabase (back)
- **Routing** : React Router v6
- **State** : TanStack React Query v5
- **Fonts** : Ariens Nobela (display) + Questrial (corps) — fichiers dans `public/fonts/`

---

## 3. Base de données Supabase (DÉJÀ EN PLACE)

Projet : `MF_booking-system` (nodywhjtymmzzxllggnu) — eu-west-1

### Tables existantes
```
profiles         (user_id, role, display_name, email, phone)
events           (name, start_date, end_date, is_active, meal_service, menu_categories, menu_price_midi, menu_price_soir)
meal_slots       (event_id, slot_date, slot_type[midi|soir], is_active, max_orders)
menu_items       (event_id, name, type[entree|plat|dessert|boisson], price, description, image_url, available, tags[])
event_menu_items (event_id, menu_item_id, custom_price, available)
slot_menu_items  (meal_slot_id, menu_item_id)
orders           (event_id, profile_id, customer_*, stand, order_number, total_amount, payment_status, stripe_*, delivery_method, company_name, billing_*)
order_lines      (order_id, meal_slot_id, menu_item_id, quantity, unit_price, prep_status[pending|preparing|ready|delivered], prepared_by/at, delivered_by/at, delivery_photo_url, guest_name)
```

### Enums
- `user_role` : admin, staff, customer
- `meal_slot_type` : midi, soir
- `menu_item_type` : entree, plat, dessert, boisson
- `payment_status` : pending, paid, refunded, cancelled
- `prep_status` : pending, preparing, ready, delivered

### Distinction flux finance vs flux admin
```
FLUX FINANCE (orders) :
  Client commande pour N jours → facture globale → paiement Stripe unique
  Statut : pending → paid → refunded

FLUX ADMIN (order_lines) :
  Chaque plat/créneau = 1 ligne → pipeline cuisine indépendant
  Statut : pending → preparing → ready → delivered
```

RLS est activé sur toutes les tables.

---

## 4. Structure fichiers cible

```
src/
├── api/
│   └── supabase.js              # Client Supabase
├── hooks/
│   ├── useAuth.js               # Auth + profil + rôle
│   ├── useEvents.js             # CRUD événements
│   ├── useMealSlots.js          # Créneaux repas
│   ├── useMenuItems.js          # Articles menu
│   ├── useOrders.js             # Commandes
│   └── useOrderLines.js         # Lignes (cuisine/livraison)
├── lib/
│   ├── AuthContext.jsx           # Provider auth Supabase
│   ├── RoleGuard.jsx             # Protection routes par rôle
│   └── utils.js
├── components/
│   ├── ui/                       # shadcn/ui + composants MF custom
│   ├── layout/
│   │   ├── AdminSidebar.jsx      # Sidebar admin (permanent)
│   │   ├── StaffHeader.jsx       # Header staff (cuisine/livraison)
│   │   └── ClientHeader.jsx      # Header client (logo + nav)
│   ├── order/                    # Flow commande client
│   ├── kitchen/                  # Composants cuisine
│   └── delivery/                 # Composants livraison
├── pages/
│   ├── MainPage.jsx              # Landing / accueil événement
│   ├── OrderPage.jsx             # Flow commande client (4 étapes)
│   ├── OrderSuccess.jsx          # Confirmation
│   ├── AdminDashboard.jsx        # Tableau de bord
│   ├── AdminMenu.jsx             # Gestion menus
│   ├── AdminOrders.jsx           # Gestion commandes
│   ├── AdminEvent.jsx            # Gestion événements
│   ├── StaffKitchen.jsx          # Vue cuisine kanban
│   └── StaffDelivery.jsx         # Vue livraisons
└── styles/
    └── fonts.css                 # @font-face Ariens Nobela + Questrial

public/
├── fonts/
│   ├── AriensNobela.otf
│   ├── AriensNobela.ttf
│   └── Questrial-Regular.ttf
└── brand/
    ├── Logo_Rose.svg
    ├── Symbole-Rose.svg
    └── Monogramme-Rose.svg
```

---

## 5. Design System — Résumé rapide

> Détails complets dans `docs/DESIGN_SYSTEM_MF.md`

### Palette
| Token Tailwind | Hex | Usage |
|----------------|-----|-------|
| `mf-rose` | `#8B3A43` | Primaire — titres, boutons, accents |
| `mf-vieux-rose` | `#BF646D` | Sous-titres, labels secondaires |
| `mf-poudre` | `#E5B7B3` | Fonds actifs, hover, badges |
| `mf-vert-olive` | `#968A42` | Tags allergènes, accents nature |
| `mf-blanc-casse` | `#F0F0E6` | Background pages |
| `mf-marron-glace` | `#392D31` | Texte courant |

### Typographies
- **Ariens Nobela** : grands titres seulement (>28px), ornementale
- **Questrial** : tout le reste — sous-titres (uppercase + tracking), corps, boutons, labels

### Shapes
- Boutons/inputs : `rounded-full` (pill, 50px)
- Cards : `rounded-2xl` (20px)
- Tags : `rounded-full` (petit)

### Règles absolues
1. **Zéro gris froid** — tous les neutres sont teintés chauds
2. **Zéro bleu** — palette exclusivement chaude + olive
3. **Beaucoup d'air** — style Monte Newcastle, espacé, premium
4. **Pas d'ombre lourde** — bordures subtiles, transitions douces
5. **Français** pour tous les textes UI

### tailwind.config.js — ajouter :
```js
theme: {
  extend: {
    colors: {
      mf: {
        rose: '#8B3A43',
        'vieux-rose': '#BF646D',
        poudre: '#E5B7B3',
        'vert-olive': '#968A42',
        'blanc-casse': '#F0F0E6',
        'marron-glace': '#392D31',
      }
    },
    fontFamily: {
      display: ['"Ariens Nobela"', 'Georgia', 'serif'],
      body: ['Questrial', 'sans-serif'],
    }
  }
}
```

---

## 6. Conventions de code

- Composants React : fonction + export default
- Hooks custom : préfixe `use`, retournent `{ data, isLoading, error, mutate }`
- Queries React Query : queryKey `['entity', id?, filters?]`
- Supabase : toujours via hooks, jamais d'appel direct dans les composants
- CSS : Tailwind utility classes avec tokens MF, pas de CSS inline sauf cas exceptionnel
- Labels UI : français. Noms de variables/fonctions : anglais
- Imports : relatifs avec `@/` alias

---

## 7. Variables d'environnement

```
VITE_SUPABASE_URL=https://nodywhjtymmzzxllggnu.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## 8. Commandes

```bash
npm run dev           # Dev server Vite
npm run build         # Build production
npm run preview       # Preview build local
```

---

## 9. Contexte migration

Ce projet migre depuis Base44 (BaaS propriétaire).
Code source original : `docs/original-base44/` (si disponible).

Mapping :
- `base44.entities.X.filter()` → `supabase.from('x').select().eq()`
- `base44.entities.X.create()` → `supabase.from('x').insert()`
- `base44.auth.me()` → `supabase.auth.getUser()`
