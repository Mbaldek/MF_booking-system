# 🔍 Diagnostic — Event Eats Now (Maison Félicien)

## Architecture actuelle

| Élément | Technologie |
|---------|-------------|
| Frontend | React 18 + Vite 6 + Tailwind + shadcn/ui |
| Backend | **Base44 (BaaS propriétaire)** — SDK gère CRUD, auth, storage |
| Routing | React Router v6 (15 pages) |
| State | React Query (TanStack) |
| PDF | jsPDF (factures côté client) |
| Paiement | Stripe importé mais **non implémenté** |

---

## Modèle de données (déduit du code)

```
Event          → { name, start_date, end_date, is_active }
MenuItem       → { event_id, name, type, price, description, available, tags[] }
Order          → { first_name, last_name, stand, phone, email, event_id, total_amount, order_number, status }
OrderItem      → { order_id, day_date, entree_id/name, plat_id/name, dessert_id/name, boisson_id/name, day_total, delivered }
```

---

## ✅ Ce qui marche bien

- **UX client** : flow de commande clair (infos → jours → menus → validation)
- **Gestion menus admin** : CRUD complet avec tags allergènes, édition bulk
- **Gestion événements** : création, activation, dates
- **Génération facture PDF** côté client (jsPDF)
- **QR Code** par commande
- **Interface responsive** mobile/desktop
- **Notifications** (système de rappels email, notifications temps réel)
- **Suivi livraison** avec photo de preuve

---

## 🚨 Problèmes critiques identifiés

### 1. Sécurité — ZERO contrôle d'accès
```
Boutons Admin et Staff visibles sur la page de commande
Aucun contrôle de rôle — tout le monde accède à tout
```
→ N'importe qui peut voir les commandes, modifier les menus, gérer les utilisateurs.

### 2. Pas de distinction Menu Midi / Menu Soir
Le modèle actuel ne gère que 4 types : `entree | plat | dessert | boisson`.
Impossible de proposer un menu midi différent du menu soir pour un même jour.

### 3. Paiement fictif
```javascript
// Order.jsx ligne 108
status: 'paid'  // ← hardcodé, aucun vrai paiement
```
Stripe est importé dans package.json mais jamais utilisé.

### 4. Confusion flux Finance vs flux Admin
Le même champ `delivered` sur `OrderItem` sert à la fois pour :
- La **préparation en cuisine** (staff)
- Le **suivi de livraison** (livreur)

→ Pas de statut intermédiaire : `à préparer → préparé → en livraison → livré`

### 5. Vendor lock-in Base44
Toute la couche données dépend de `base44.entities.X`. Migration = réécriture complète du data layer.

### 6. Dénormalisation excessive
OrderItem stocke à la fois l'ID et le nom de chaque plat (entree_id + entree_name).
Pas grave sur Base44, mais problématique sur un vrai DB.

---

## 🎯 Plan de migration recommandé — Stack Local

### Stack cible
| Couche | Technologie | Pourquoi |
|--------|-------------|----------|
| Frontend | **React + Vite** (existant) | On garde, c'est solide |
| UI | **shadcn/ui + Tailwind** (existant) | On garde |
| Backend/DB | **Supabase** (PostgreSQL + Auth + RLS) | Gratuit, scalable, vrai SQL |
| Paiement | **Stripe Checkout** | Standard, sécurisé |
| Déploiement | **Vercel** (front) + Supabase (back) | Gratuit tier |
| Dev | **VS Code + Claude Code + GitHub** | Ton choix |

### Nouveau modèle de données (Supabase/PostgreSQL)

```sql
-- ÉVÉNEMENTS
events (id, name, start_date, end_date, is_active, created_at)

-- CRÉNEAUX REPAS (NOUVEAU — midi/soir par jour)
meal_slots (id, event_id, date, slot_type: 'midi'|'soir', is_active)

-- ARTICLES DU MENU
menu_items (id, event_id, name, type, price, description, available, tags[], image_url)

-- MENUS DISPONIBLES PAR CRÉNEAU (NOUVEAU)
slot_menu_items (id, meal_slot_id, menu_item_id)
→ Permet d'avoir des plats différents midi vs soir

-- COMMANDES (flux finance = commande globale)
orders (id, event_id, customer_name, customer_email, customer_phone, 
        stand, order_number, total_amount, payment_status, stripe_session_id,
        created_at)

-- LIGNES DE COMMANDE (flux admin = unitaire par jour/créneau)
order_lines (id, order_id, meal_slot_id, menu_item_id, 
             unit_price, quantity,
             prep_status: 'pending'|'preparing'|'ready'|'delivered',
             prepared_at, prepared_by,
             delivered_at, delivered_by, delivery_photo_url)

-- UTILISATEURS & RÔLES
profiles (id, user_id, role: 'admin'|'staff'|'customer', display_name)
```

### Priorités de développement (selon tes choix)

```
Phase 1 — Interface client (réservation)              ██████████ 
  ├─ Migrer le flow de commande sur Supabase
  ├─ Ajouter sélection midi/soir
  └─ Améliorer l'UX mobile

Phase 2 — Calendrier événement + menus                ████████░░
  ├─ CRUD événements + créneaux repas
  ├─ Association menus ↔ créneaux
  └─ Admin : vue calendrier visuelle

Phase 3 — Paiement / facturation                      ██████░░░░
  ├─ Intégration Stripe Checkout
  ├─ Webhooks paiement (confirmation auto)
  └─ Factures PDF améliorées

Phase 4 — Suivi cuisine + livraison                   ████░░░░░░
  ├─ Pipeline : pending → preparing → ready → delivered
  ├─ Vue cuisine temps réel (par créneau/jour)
  └─ Preuve de livraison photo
```

---

## 💡 Décision clé : Base44 → Supabase

| | Rester sur Base44 | Migrer vers Supabase |
|---|---|---|
| **Effort** | Faible | Moyen (2-3 jours de migration data layer) |
| **Sécurité** | ❌ Limitée (pas de RLS) | ✅ Row Level Security natif |
| **Midi/Soir** | Faisable mais hacky | ✅ Modèle propre avec meal_slots |
| **Paiement** | Compliqué (pas de webhooks) | ✅ Edge Functions pour Stripe |
| **Scalabilité** | Limité | ✅ PostgreSQL complet |
| **Coût** | Payant | Gratuit (Free tier) |
| **Portabilité** | ❌ Vendor lock-in | ✅ Standard SQL, exportable |

**Ma recommandation** : Migrer vers Supabase. L'effort est concentré sur la couche data (remplacer `base44.entities.X` par des appels Supabase), le frontend React reste quasi identique.

---

## Prochaine étape

Si tu valides ce plan, je peux :
1. **Créer le projet Supabase** avec le schéma SQL complet
2. **Créer le data layer** (hooks React Query + Supabase client) pour remplacer Base44
3. **Migrer page par page** en commençant par le flow client (Order)

Dis-moi si tu veux ajuster quelque chose avant qu'on démarre ! 🚀
