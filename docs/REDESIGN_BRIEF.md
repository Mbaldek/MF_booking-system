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

> ⚠️ **CRITIQUE : MOBILE-FIRST OBLIGATOIRE**
> Les staff (cuisine + livraison) utilisent un TÉLÉPHONE, debout, en mouvement.
> Le Kanban 4 colonnes desktop est INUTILISABLE en mobile (testé et validé).
> Solution : design responsive — tabs mobile / kanban desktop.

### 11. StaffKitchen.jsx
**Mockup mobile** : `mockups-reference/StaffKitchen-Mobile-MF.jsx` ← PRIORITAIRE
**Mockup desktop** : `mockups-reference/StaffKitchen-MF.jsx` (kanban, pour écrans >1024px uniquement)

#### Architecture responsive
```
Mobile (<768px) → Tabs horizontaux + liste verticale de cards
Tablet (768-1024px) → 2 colonnes max
Desktop (>1024px) → Kanban 4 colonnes (original)
```

#### UX mobile (layout par défaut)

**Header sticky** :
- Logo compact + badge "🍳 Cuisine"
- Filtre midi/soir (3 boutons pill compacts)
- Barre de progression globale (% livré)

**Tab bar** (le pattern clé — remplace le kanban) :
- 4 onglets : Attente | En cours | Prêts | Livrés
- Chaque onglet = compteur + icône
- Active = underline colorée (couleur du statut)
- 1 seul onglet visible à la fois

**Cards commande** (groupées par order, PAS par item isolé) :
- Stand en badge GROS (64×64px) — c'est l'info n°1 en cuisine
- Nom client + ref + badge midi/soir
- Items repliables (tap pour déplier)
- Chaque item a un bouton d'avancement individuel
- **Bouton bulk** en bas de carte : "Commencer → Toute la commande"
- Min-height 48px sur tous les boutons (zone pouce)

**Footer fixe** (zone pouce) :
- Compteur commandes dans le tab actif
- Bouton "Tout avancer" pour action bulk

#### Regroupement par commande (pas par plat)
```
AVANT (cassé mobile) :
  Colonne "En attente" : Velouté, Suprême, Crème brûlée, Eau — 4 cards séparées
  → Impossible de savoir que ça vient de la même commande

APRÈS :
  Card "CMD-847 · Sophie Martin · A-12" :
    🥗 Velouté butternut      [Préparer]
    🍽 Suprême de volaille     [Préparer]
    🍰 Crème brûlée           [Préparer]
    🥤 Eau minérale           [Préparer]
    ─────────────────────────────────
    [   Commencer → Toute la commande   ]
```

#### Data + Realtime
```js
// Charger order_lines avec JOIN orders pour avoir le contexte commande
const { data: lines } = useQuery({
  queryKey: ['order_lines', event_id, slotFilter],
  queryFn: () => supabase
    .from('order_lines')
    .select('*, orders!inner(id, order_number, customer_first_name, customer_last_name, stand), meal_slots!inner(slot_type), menu_items!inner(name, type)')
    .eq('orders.event_id', event_id)
    .order('created_at')
})

// Grouper côté client par order_id
const grouped = groupBy(lines, 'order_id')

// Realtime
useEffect(() => {
  const channel = supabase.channel('kitchen')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_lines' }, () => {
      queryClient.invalidateQueries(['order_lines'])
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [])

// Avancer un item
const advanceItem = useMutation({
  mutationFn: ({ lineId, newStatus }) =>
    supabase.from('order_lines').update({
      prep_status: newStatus,
      prepared_by: currentUser.display_name,
      prepared_at: newStatus === 'ready' ? new Date().toISOString() : null,
    }).eq('id', lineId),
  onSuccess: () => queryClient.invalidateQueries(['order_lines'])
})

// Avancer toute une commande
const advanceOrder = useMutation({
  mutationFn: ({ orderLineIds, newStatus }) =>
    supabase.from('order_lines').update({
      prep_status: newStatus,
      prepared_by: currentUser.display_name,
    }).in('id', orderLineIds),
  onSuccess: () => queryClient.invalidateQueries(['order_lines'])
})
```

### 12. StaffDelivery.jsx
**Mockup mobile** : `mockups-reference/StaffDelivery-Mobile-MF.jsx` ← PRIORITAIRE
**Mockup desktop** : `mockups-reference/StaffDelivery-MF.jsx`

#### UX mobile

**Header sticky** :
- Logo compact + badge "🚚 Livraisons"
- Badges compteurs (X à livrer / X en cours)

**2 onglets** (pas plus) : "À livrer (N)" | "Fait (N)"

**Suggestion d'itinéraire** (bandeau) :
- "🗺 A-12 → B-08 → C-22" (stands triés par proximité/allée)

**Cards livraison** :
- Stand = élément dominant (badge 64×64, le plus gros de la carte)
- Nom + ref + slot midi/soir
- Items en pills compactes (emoji + ×qty seulement, pas besoin du nom complet pour le livreur)
- Alerte allergies si notes présentes
- **Bouton pleine largeur** min-height 54px :
  - "🚚 Partir livrer" (orange) → passe en in_transit
  - "✓ Confirmer la livraison" (vert) → ouvre confirmation inline
- **Confirmation inline** (PAS de modal) :
  - Zone photo optionnelle (dashed border, tap pour caméra)
  - Boutons Annuler / "✓✓ C'est livré"

#### Data
```js
// Charger commandes prêtes à livrer
const { data } = useQuery({
  queryKey: ['deliveries', event_id],
  queryFn: () => supabase
    .from('orders')
    .select('*, order_lines!inner(*, menu_items!inner(name, type), meal_slots!inner(slot_type))')
    .eq('event_id', event_id)
    .in('order_lines.prep_status', ['ready', 'delivered'])
    .order('stand')
})

// Confirmer livraison + photo
const confirmDelivery = useMutation({
  mutationFn: async ({ orderId, photoFile }) => {
    let photoUrl = null
    if (photoFile) {
      const { data } = await supabase.storage
        .from('delivery-photos')
        .upload(`${orderId}/${Date.now()}.jpg`, photoFile)
      photoUrl = data?.path
    }
    return supabase.from('order_lines')
      .update({
        prep_status: 'delivered',
        delivered_by: currentUser.display_name,
        delivered_at: new Date().toISOString(),
        delivery_photo_url: photoUrl,
      })
      .eq('order_id', orderId)
      .eq('prep_status', 'ready')
  }
})
```

---

## Notes d'implémentation

### Realtime
Activer Supabase Realtime sur `order_lines` et `orders` pour les vues Kitchen et Delivery.

### Responsive
- Client (MainPage, OrderPage) : **mobile-first**, max-width 520px centré
- Admin : desktop, sidebar 220px + main fluid
- **Staff Kitchen** : **MOBILE-FIRST** — tabs + liste cards. Kanban uniquement >1024px.
- **Staff Delivery** : **MOBILE-FIRST** — card stack. Le livreur est DEBOUT avec un TÉLÉPHONE.
- Tous les boutons d'action staff : **min-height 48px** (zone pouce)
- Pas de modal sur mobile staff → confirmation inline dans la card

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
