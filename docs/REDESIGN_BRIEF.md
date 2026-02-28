# REDESIGN_BRIEF.md — Instructions de redesign pour Claude Code

> Ce document est le plan d'exécution. Chaque écran a un mockup JSX de référence dans `mockups-reference/`.
> Lis `DESIGN_SYSTEM_MF.md` pour les tokens et `CLAUDE.md` pour l'architecture.

---

## Ordre d'implémentation

```
Phase 1 — Fondations
  1. Setup fonts + tailwind tokens + @font-face
  2. Composants UI de base (MfButton, MfInput, MfCard, MfBadge, MfToggle)
  3. Layouts (ClientHeader, AdminSidebar, StaffHeader)

Phase 2 — Client (priorité absolue, 90% du trafic)
  4. MainPage.jsx         ← mockup: MainPage-MF.jsx
  5. OrderPage.jsx         ← mockup: OrderPage-MF-Prototype.jsx
  6. OrderSuccess.jsx      (pas de mockup, dériver du step 4 confirmation)

Phase 3 — Admin
  7. AdminDashboard.jsx    ← mockup: AdminDashboard-MF.jsx
  8. AdminOrders.jsx       ← mockup: AdminOrders-MF.jsx
  9. AdminMenu.jsx         ← mockup: AdminMenuBuilder-MF.jsx
  10. AdminEvent.jsx       (pas de mockup, dériver du style AdminDashboard)

Phase 4 — Staff
  11. StaffKitchen.jsx     ← mockup: StaffKitchen-MF.jsx
  12. StaffDelivery.jsx    ← mockup: StaffDelivery-MF.jsx
```

---

## Phase 1 — Fondations

### 1.1 Fonts

Copier dans `public/fonts/` :
- `AriensNobela.otf` + `.ttf`
- `Questrial-Regular.ttf`

Créer `src/styles/fonts.css` :
```css
@font-face {
  font-family: 'Ariens Nobela';
  src: url('/fonts/AriensNobela.otf') format('opentype'),
       url('/fonts/AriensNobela.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Questrial';
  src: url('/fonts/Questrial-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

Importer dans `src/main.jsx` : `import './styles/fonts.css'`

### 1.2 Tailwind config

Ajouter à `tailwind.config.js` dans `theme.extend` :
```js
colors: {
  mf: {
    rose: '#8B3A43',
    'vieux-rose': '#BF646D',
    poudre: '#E5B7B3',
    'vert-olive': '#968A42',
    'blanc-casse': '#F0F0E6',
    'marron-glace': '#392D31',
    white: '#FDFAF7',
    border: '#E5D9D0',
    muted: '#9A8A7C',
  }
},
fontFamily: {
  display: ['"Ariens Nobela"', 'Georgia', 'serif'],
  body: ['Questrial', 'system-ui', 'sans-serif'],
  serif: ['Georgia', '"Times New Roman"', 'serif'],
},
borderRadius: {
  'pill': '50px',
  'card': '20px',
},
```

Statut colors (admin only) :
```js
colors: {
  status: {
    green: '#4A7C59',
    orange: '#C4793A',
    red: '#A63D40',
  }
}
```

### 1.3 Composants UI partagés

Créer dans `src/components/ui/` :

**MfButton** — Pill button
```
Props : variant (primary | secondary | ghost), size (sm | md | lg), disabled, fullWidth
Primary : bg-mf-rose text-mf-blanc-casse rounded-pill
Secondary : bg-white border border-mf-border text-mf-marron-glace rounded-pill
Ghost : bg-transparent text-mf-rose
Toujours : uppercase, tracking-wider, font-body, transition-all duration-200
Active : scale-[0.97]
```

**MfInput** — Pill input
```
Props : label, placeholder, type, error
Label : text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body
Input : rounded-pill border-mf-border px-5 py-3 font-body text-[15px]
Focus : border-mf-rose ring-0
```

**MfCard** — Rounded card
```
Props : children, className
bg-white rounded-card border border-mf-border p-6
Pas de shadow par défaut, shadow-sm optionnel
```

**MfBadge** — Status/tag badge
```
Props : variant (rose | olive | poudre | green | orange | red), children
Pill shape, text-[9px] uppercase tracking-wide, px-2.5 py-0.5
```

**MfSlotToggle** — Midi/Soir
```
Props : value (midi|soir), onChange
Deux boutons dans un container pill border, actif = bg-mf-rose text-white
Midi = "☀ Midi", Soir = "☽ Soir"
```

**MfStepIndicator** — Progress steps
```
Props : steps (string[]), current (number)
Cercles numérotés avec lignes, actif = bg-mf-poudre border-mf-rose
Complété = bg-mf-rose + check
Labels sous chaque cercle en uppercase 9px
```

### 1.4 Layouts

**ClientHeader** (`src/components/layout/ClientHeader.jsx`)
```
Ref : header du MainPage-MF.jsx
Nav sticky : Menu (hamburger) | Logo centré (Maison + Félicien italic) | Commander
Side menu overlay avec liens Georgia italic
```

**AdminSidebar** (`src/components/layout/AdminSidebar.jsx`)
```
Ref : Sidebar du AdminDashboard-MF.jsx
220px fixe, logo + badge Admin, nav items avec icônes
Active state : bg-mf-poudre/30 + border-right rose
Footer : nom + email admin
```

**StaffHeader** (`src/components/layout/StaffHeader.jsx`)
```
Ref : header du StaffKitchen-MF.jsx
Logo compact | Divider | Badge rôle (Cuisine orange / Livraisons green)
Slot filter (Tous/Midi/Soir) à droite
```

---

## Phase 2 — Pages Client

### 4. MainPage.jsx
**Mockup** : `mockups-reference/MainPage-MF.jsx`

Sections à implémenter :
1. **Hero** — Ornements botaniques SVG (utiliser `Symbole-Rose.svg`), "Maison" uppercase + "Félicien" italic 56px, CTA pill
2. **Event Card** — Charger le prochain événement actif depuis Supabase. Badge "Prochain événement", grille dates/services/plats, indicateur places restantes, CTA "Réserver"
3. **Menu Preview** — Charger les menu_items de l'événement actif, grouper par type, accordéon hover
4. **Comment ça marche** — 3 étapes statiques (Choisissez, Payez, Savourez)
5. **Citation** — Texte statique tiré de la charte
6. **Footer** — Fond mf-rose, logo poudré, liens

**Data** :
```js
// Charger événement actif
const { data: event } = useEvents({ is_active: true, limit: 1 })
// Charger items du menu
const { data: menuItems } = useMenuItems({ event_id: event?.id })
// Compter commandes pour "places restantes"
const { data: orderCount } = useOrders({ event_id: event?.id, count: true })
```

### 5. OrderPage.jsx
**Mockup** : `mockups-reference/OrderPage-MF-Prototype.jsx`

Flow en 4 étapes (state machine simple avec useState) :

**Étape 0 — Infos client**
- Inputs pill : Prénom, Nom, Stand, Téléphone, Email
- Si l'utilisateur est connecté, pré-remplir depuis le profil
- Validation côté client avant de continuer
- Bouton "Continuer →"

**Étape 1 — Sélection des jours**
- Charger `meal_slots` de l'événement actif, grouper par `slot_date`
- Afficher des DayChips (Lundi 16 mars, etc.)
- Multi-select
- Bouton "Choisir les menus →"

**Étape 2 — Sélection des menus**
- Tabs horizontaux scrollables par jour sélectionné
- Toggle Midi/Soir par jour
- 4 sections : Entrées, Plats, Desserts, Boissons
- Charger items via `slot_menu_items` JOIN `menu_items` (si vide, fallback sur `event_menu_items`)
- Sélection unique par catégorie par jour/slot
- **Sticky footer** : compteur repas + total + "Récapitulatif →"
- Tags allergènes en badge olive

**Étape 3 — Récapitulatif**
- Résumé client (nom, stand, email)
- Par jour : items sélectionnés avec prix, sous-total
- Total général en serif 28px
- Bouton "Valider et payer →" → appelle Edge Function pour créer Stripe Checkout Session
- Redirige vers Stripe

**Data mutations** :
```js
// Créer order + order_lines en une transaction
const createOrder = useMutation({
  mutationFn: async (orderData) => {
    const { data: order } = await supabase.from('orders').insert({
      event_id, customer_first_name, customer_last_name,
      customer_email, customer_phone, stand,
      total_amount, payment_status: 'pending',
      order_number: generateOrderNumber()
    }).select().single()

    const lines = selectedMeals.flatMap(({ dayKey, slot, items }) =>
      Object.entries(items).filter(([_, id]) => id).map(([type, menuItemId]) => ({
        order_id: order.id,
        meal_slot_id: getMealSlotId(dayKey, slot),
        menu_item_id: menuItemId,
        quantity: 1,
        unit_price: getItemPrice(menuItemId),
      }))
    )
    await supabase.from('order_lines').insert(lines)
    return order
  }
})
```

### 6. OrderSuccess.jsx
- Récupérer order via `stripe_checkout_session_id` (query param)
- Afficher : check vert, "Merci, {prénom} !", n° commande, total, email de confirmation
- Lien "Nouvelle commande"

---

## Phase 3 — Pages Admin

### 7. AdminDashboard.jsx
**Mockup** : `mockups-reference/AdminDashboard-MF.jsx`

Layout : `AdminSidebar` + main content

**Composants** :
- 4 StatCards (commandes, CA, repas à préparer, taux livraison)
- Table dernières commandes (5 dernières) avec badges statut
- Mini bar chart revenus par jour (midi vs soir) — composant custom SVG ou recharts
- Pipeline cuisine (barres de progression par statut)
- Actions rapides (export, modifier menu, envoyer rappel)

**Data** :
```js
const { data: orders } = useOrders({ event_id, limit: 5, orderBy: 'created_at.desc' })
const { data: lines } = useOrderLines({ event_id }) // pour pipeline stats
// Calculer stats côté client ou via RPC
```

### 8. AdminOrders.jsx
**Mockup** : `mockups-reference/AdminOrders-MF.jsx`

- Recherche (nom, n° commande, stand)
- Filtres : statut (payée/en attente/annulée/remboursée) + service (midi/soir)
- Table complète avec : n° commande, client+société, stand (badge), service, articles, total, statut (badge), progression préparation (mini barre)
- Clic sur une ligne → modal détail avec infos complètes, boutons rembourser / envoyer reçu
- Boutons header : export CSV, commande manuelle

### 9. AdminMenu.jsx
**Mockup** : `mockups-reference/AdminMenuBuilder-MF.jsx`

- Tabs catégories (Entrées/Plats/Desserts/Boissons) avec compteur
- Recherche
- Liste de cards par item avec : nom, description, prix, badges midi/soir, tags allergènes, toggle disponibilité
- Modal d'édition : nom, description, catégorie, prix, toggles midi/soir, toggle disponible
- Bouton "+ Ajouter un plat"
- CRUD via `useMenuItems` hooks

### 10. AdminEvent.jsx (pas de mockup)
Dériver le style admin (sidebar + cards)
- Liste des événements
- Formulaire création/édition (nom, dates, services midi/soir/both, catégories menu)
- Auto-génération des meal_slots à la création

---

## Phase 4 — Pages Staff

### 11. StaffKitchen.jsx
**Mockup** : `mockups-reference/StaffKitchen-MF.jsx`

Layout : `StaffHeader` + Kanban

**Kanban 4 colonnes** : En attente → En préparation → Prêts → Livrés

Chaque carte = 1 `order_line` :
- Icône type (🥗🍽🍰🥤)
- Nom du plat, quantité
- Réf commande + stand + nom client (JOIN orders)
- Badge midi/soir
- **Bouton avancer** → update `prep_status` dans order_lines

Fonctionnalités :
- Filtre midi/soir dans le header
- Barre de progression globale (livrés/total)
- Vue alternative en liste
- **Realtime** : souscrire aux changements order_lines via Supabase realtime

```js
// Realtime subscription
useEffect(() => {
  const channel = supabase.channel('kitchen')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_lines' }, (payload) => {
      queryClient.invalidateQueries(['order_lines'])
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [])
```

### 12. StaffDelivery.jsx
**Mockup** : `mockups-reference/StaffDelivery-MF.jsx`

Layout : `StaffHeader` + Liste de cards

Chaque card = 1 commande regroupée par stand :
- Badge stand (gros, proéminent)
- Nom client, n° commande, badge midi/soir
- Liste items en pills
- Alerte si notes (allergies)
- Statuts : Prêt → En livraison → Livré

Actions :
- "Partir en livraison" → update toutes les order_lines du même order
- "Confirmer livraison" → confirmation avec zone photo upload (Supabase Storage)
- Itinéraire suggéré (stands à livrer triés)

**Data** :
```js
// Charger commandes avec lignes status = ready
const { data } = useOrders({
  event_id,
  with_lines: true,
  lines_status: ['ready', 'delivered'],
  orderBy: 'stand'
})
```

---

## Notes d'implémentation

### Realtime
Activer Supabase Realtime sur `order_lines` et `orders` pour les vues Kitchen et Delivery.

### Responsive
- Client (MainPage, OrderPage) : **mobile-first**, max-width 520px centré
- Admin : desktop, sidebar 220px + main fluid
- Staff Kitchen : desktop large (kanban 4 colonnes)
- Staff Delivery : **optimisé tablette/mobile** (les livreurs sont debout)

### Transitions
Toutes les interactions avec `transition-all duration-200` minimum.
Animations d'entrée : `animate-fade-up` (définir dans tailwind).

### Accessibilité
- Focus visible sur tous les éléments interactifs
- Labels sur tous les inputs
- Rôles ARIA sur les boutons de statut
- Contraste suffisant (vérifier mf-muted sur blanc-cassé)

---

## Checklist finale

- [ ] Fonts chargées (Ariens Nobela + Questrial)
- [ ] Tokens Tailwind MF configurés
- [ ] SVG logos copiés dans public/brand/
- [ ] Composants UI MF (Button, Input, Card, Badge, Toggle, Steps)
- [ ] Layouts (ClientHeader, AdminSidebar, StaffHeader)
- [ ] MainPage avec données dynamiques
- [ ] OrderPage 4 étapes avec Stripe
- [ ] AdminDashboard avec stats
- [ ] AdminOrders avec filtres + modal
- [ ] AdminMenu CRUD
- [ ] StaffKitchen kanban + realtime
- [ ] StaffDelivery cards + photo
- [ ] Routes protégées par rôle (RoleGuard)
- [ ] Variables .env configurées
