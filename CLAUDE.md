# CLAUDE.md — Event Eats (Maison Félicien)

## Projet
Outil de réservation de commandes repas pour clients lors d'événements (salons, foires, congrès).
Traiteur "Maison Félicien" — service midi et soir sur plusieurs jours.

## Stack technique
- **Frontend** : React 18 + Vite 6 + Tailwind CSS + shadcn/ui
- **Backend/DB** : Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Paiement** : Stripe Checkout (session côté serveur via Edge Function)
- **Déploiement** : Vercel (front) + Supabase (back)
- **Routing** : React Router v6
- **State** : TanStack React Query v5

## Architecture des données

### Concepts clés
- **Event** : un salon/événement avec dates début-fin
- **Meal Slot** : créneau repas = 1 jour + midi OU soir (auto-généré à la création d'un événement)
- **Menu Item** : un plat (entrée, plat, dessert, boisson) avec prix et tags allergènes
- **Slot Menu Item** : association plat ↔ créneau (permet menus différents midi vs soir)
- **Order** : commande globale d'un client = flux finance (facturation totale)
- **Order Line** : ligne unitaire = 1 plat pour 1 créneau = flux admin (cuisine + livraison)

### Distinction flux finance vs flux admin
```
FLUX FINANCE (Order) :
  → Client commande pour N jours, midi et/ou soir
  → Facture globale avec montant total
  → Paiement Stripe unique
  → Statut : pending → paid → refunded

FLUX ADMIN (Order Line) :
  → Chaque jour/créneau génère des lignes séparées
  → La cuisine voit : "Jour X, midi : préparer 3 entrées César, 2 plats boeuf..."
  → Pipeline : pending → preparing → ready → delivered
  → Chaque ligne est indépendante (peut être en retard, etc.)
```

### Rôles utilisateur
- **admin** : tout voir, tout modifier (événements, menus, commandes, users)
- **staff** : voir les commandes, gérer la préparation et livraison
- **customer** : passer commande, voir ses propres commandes

## Structure fichiers

```
src/
├── api/
│   └── supabase.js          # Client Supabase + helpers
├── hooks/
│   ├── useEvents.js          # CRUD événements
│   ├── useMealSlots.js       # Créneaux repas
│   ├── useMenuItems.js       # Articles menu
│   ├── useOrders.js          # Commandes (flux finance)
│   ├── useOrderLines.js      # Lignes commande (flux admin)
│   └── useAuth.js            # Auth + profil + rôle
├── lib/
│   ├── AuthContext.jsx        # Provider auth Supabase
│   ├── RoleGuard.jsx          # Protection routes par rôle
│   └── utils.js
├── components/
│   ├── order/                 # Composants flow commande client
│   ├── kitchen/               # Composants vue cuisine
│   ├── invoice/               # Génération factures
│   └── ui/                    # shadcn/ui components
├── pages/
│   ├── Order.jsx              # Page commande client (main page)
│   ├── OrderSuccess.jsx       # Confirmation + QR + facture
│   ├── AdminDashboard.jsx     # Tableau de bord admin
│   ├── AdminEvent.jsx         # Gestion événements
│   ├── AdminMenu.jsx          # Gestion menus + créneaux
│   ├── AdminOrders.jsx        # Vue commandes (finance)
│   ├── StaffKitchen.jsx       # Vue cuisine (préparation)
│   ├── StaffDelivery.jsx      # Vue livraison
│   └── CustomerProfile.jsx    # Profil + historique client
└── supabase/
    ├── migrations/            # SQL migrations
    └── functions/             # Edge Functions (Stripe webhooks)
```

## Conventions de code
- Composants React : fonction + export default
- Hooks custom : préfixe `use`, retournent { data, isLoading, error, mutate }
- Queries React Query : queryKey cohérent `['entity', id?, filters?]`
- Supabase : toujours utiliser les hooks, jamais d'appel direct dans les composants
- CSS : Tailwind utility classes, pas de CSS custom
- Français pour les labels UI, anglais pour le code

## Variables d'environnement
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Commandes
```bash
npm run dev       # Dev server (Vite)
npm run build     # Build production
npx supabase db push   # Appliquer migrations
npx supabase functions serve  # Edge Functions local
```

## Contexte migration
Ce projet est une migration depuis Base44 (BaaS propriétaire).
Le code source original est dans `/docs/original-base44/`.
La logique métier frontend est à conserver, seule la couche données change :
- `base44.entities.X.filter()` → `supabase.from('x').select().eq()`
- `base44.entities.X.create()` → `supabase.from('x').insert()`
- `base44.auth.me()` → `supabase.auth.getUser()`
