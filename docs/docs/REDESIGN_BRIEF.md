# REDESIGN_BRIEF.md — Instructions de redesign pour Claude Code

> Ce document est le plan d'exécution. Chaque écran a un mockup JSX de référence dans `mockups-reference/`.
> Lis `DESIGN_SYSTEM_MF.md` pour les tokens et `CLAUDE.md` pour l'architecture.
> Le mockup PRINCIPAL du flow client est `BookingFlow-V4-FINAL.jsx` — il contient les 4 étapes complètes.

---

## Ordre d'implémentation

```
Phase 1 — Fondations
  1. Setup fonts + tailwind tokens + @font-face
  2. Composants UI de base (MfButton, MfInput, MfCard, MfBadge, MfToggle, MfCheckbox, MfBlurModal)
  3. Layouts (ClientHeader, AdminSidebar, StaffHeader)

Phase 2 — Client (priorité absolue, 90% du trafic)
  4. MainPage.jsx               ← mockup: MainPage-MF.jsx
  5. OrderPage.jsx (4 étapes)   ← mockup: BookingFlow-V4-FINAL.jsx
  6. OrderSuccess.jsx            (dériver du step 3 confirmation)

Phase 3 — Admin
  7. AdminDashboard.jsx          ← mockup: AdminDashboard-MF.jsx
  8. AdminOrders.jsx             ← mockup: AdminOrders-MF.jsx
  9. AdminMenu.jsx               ← mockup: AdminMenuBuilder-MF.jsx
  10. AdminEvent.jsx              (dériver du style AdminDashboard)

Phase 4 — Staff
  11. StaffKitchen.jsx           ← mockup mobile: StaffKitchen-Mobile-MF.jsx
  12. StaffDelivery.jsx          ← mockup mobile: StaffDelivery-Mobile-MF.jsx
```

---

## Phase 1 — Fondations

### 1.1 Fonts

Fichiers dans `public/fonts/` : AriensNobela.otf, AriensNobela.ttf, Questrial-Regular.ttf
Créer `src/styles/fonts.css` avec @font-face, importer dans main.jsx.

### 1.2 Tailwind config

Tokens mf-* (rose, vieux-rose, poudre, vert-olive, blanc-casse, marron-glace, white, border, muted).
fontFamily (display, body, serif). borderRadius (pill: 50px, card: 20px).
Status colors pour admin/staff : green #4A7C59, orange #C4793A, red #A63D40.

### 1.3 Composants UI

MfButton (primary/secondary/ghost/green/outline, pill, uppercase, pulse animation).
MfInput (pill input avec label uppercase rose).
MfCard (rounded-card, border subtle).
MfBadge (variants couleur, pill).
MfSlotToggle (midi/soir toggle pill).
MfStepIndicator (4 étapes : Infos, Créneaux, Menus, Récap).
MfCheckbox (carré arrondi 26px, rose quand checked).
MfBlurModal (backdrop blur 8px, card centrée, animation scale+fade).

### 1.4 Layouts

ClientHeader : sticky, logo centré, menu hamburger, bouton Commander.
AdminSidebar : 220px fixe, nav items, badge Admin.
StaffHeader : logo compact, badge rôle, filtre midi/soir.

---

## Phase 2 — Pages Client

### 4. MainPage.jsx
Mockup : `MainPage-MF.jsx`
Hero + Event Card + Menu Preview + Comment ça marche + Footer.
Données dynamiques Supabase (événement actif, menu_items, count commandes).

### 5. OrderPage.jsx — Flow complet 4 étapes
Mockup PRINCIPAL : `BookingFlow-V4-FINAL.jsx`

#### ÉTAPE 0 — Infos client
Inputs pill : Nom de famille, Stand, Téléphone, Email.
PAS de convives ici. Pré-remplir si user connecté.
CTA "Continuer →"

#### ÉTAPE 1 — Votre équipe & Créneaux (MATRICE)

**Section A — "Votre équipe"**
Input prénom + bouton "+" (max 6). Chips avec avatar lettre + bouton ×.
Prénoms saisis UNE SEULE FOIS, réutilisés partout.

**Section B — "Qui mange quand ?" (matrice cross-table)**
1 carte par convive. Chaque carte = slot pills cliquables (✓ quand coché).
- "⚡ Tout cocher" global = 1 tap, matrice pleine
- "⚡ Tous" par convive = tous les créneaux pour cette personne
- Décocher les exceptions individuellement
Sous-total dynamique par créneau + estimation totale.
CTA "Choisir les menus (X repas) →"

Données : meal_slots depuis Supabase. Matrice = state local matrix[conviveName][slotId].

#### ÉTAPE 2 — Menus (funnel linéaire)

Un créneau à la fois. Tabs créneaux en haut avec badge nb convives.
Progress bar "Créneau 1/3 · 0/3 validés".

**Toggle "Même menu pour tous"** (si 2+ convives sur le créneau) :
ON = 1 menu pour tous. OFF = tabs convives individuels (pré-remplis depuis le commun).

**Catégories collapsibles** (🥗 Entrée, 🍽 Plat, 🍰 Dessert, 🥤 Boisson) :
Auto-repli 280ms après sélection → résumé "✓ [nom] — modifier".
Catégorie suivante non-remplie reste ouverte.
Sélection unique par catégorie.

**CTA funnel** "Valider ma sélection →" :
Disabled tant que 4 catégories pas remplies. Pulse quand complet.
Dernier créneau = "Voir le récapitulatif →" (vert).

**Modal auto-fill** (après validation créneau 1) :
MfBlurModal centré. "Même menu partout ?"
Accepter → pré-remplir tous les créneaux restants.
Bandeau "⚡ Pré-rempli. Modifiez si besoin." sur les créneaux copiés.

**Sticky footer** : créneaux validés + total + "Récapitulatif →"

**Mutation Supabase** : order + order_lines avec guest_name par convive.

#### ÉTAPE 3 — Récapitulatif
Client + stand + email. Par créneau : convives + menus en pills + sous-total.
Total serif 28px. CTA "Valider et payer →" (vert) → Stripe Checkout.

### 6. OrderSuccess.jsx
Confirmation après retour Stripe. N° commande, montant, email.

---

## Phase 3 — Pages Admin

### 7. AdminDashboard.jsx (mockup: AdminDashboard-MF.jsx)
Sidebar + 4 stat cards + table commandes + chart revenus + pipeline cuisine.

### 8. AdminOrders.jsx (mockup: AdminOrders-MF.jsx)
Recherche + filtres + table + modal détail + export CSV.

### 9. AdminMenu.jsx (mockup: AdminMenuBuilder-MF.jsx)
Tabs catégories + CRUD items + modal édition.

### 10. AdminEvent.jsx
CRUD événements + auto-génération meal_slots.

---

## Phase 4 — Pages Staff (MOBILE-FIRST)

### 11. StaffKitchen.jsx (mockup: StaffKitchen-Mobile-MF.jsx)
Mobile : tabs 4 statuts + cards groupées par commande + bulk action.
Desktop >1024px : kanban 4 colonnes.
Realtime Supabase sur order_lines.

### 12. StaffDelivery.jsx (mockup: StaffDelivery-Mobile-MF.jsx)
Mobile : 2 tabs (À livrer / Fait) + cards par stand + confirmation inline + photo.
Min-height 48px sur tous les boutons.

---

## Notes

### Responsive
Client : mobile-first, max-width 520px. Admin : desktop. Staff : MOBILE-FIRST.

### Transitions
Toutes les interactions : transition-all 200ms min.
Collapse catégories : max-height 0.3s. Modal : scale 0.92→1, 0.4s. Pulse CTA : 2.5s.
