# Base44 → Supabase — Cheatsheet de migration

## Client

```javascript
// AVANT (Base44)
import { base44 } from '@/api/base44Client';

// APRÈS (Supabase)
import { supabase } from '@/api/supabase';
```

## CRUD Operations

### Lire une liste
```javascript
// AVANT
const events = await base44.entities.Event.list('-created_date');
const activeEvents = await base44.entities.Event.filter({ is_active: true });

// APRÈS
const { data: events } = await supabase
  .from('events')
  .select('*')
  .order('created_at', { ascending: false });

const { data: activeEvents } = await supabase
  .from('events')
  .select('*')
  .eq('is_active', true);
```

### Lire un item
```javascript
// AVANT
const event = await base44.entities.Event.get(id);

// APRÈS
const { data: event } = await supabase
  .from('events')
  .select('*')
  .eq('id', id)
  .single();
```

### Créer
```javascript
// AVANT
const order = await base44.entities.Order.create({ ...data });

// APRÈS
const { data: order, error } = await supabase
  .from('orders')
  .insert({ ...data })
  .select()
  .single();
```

### Mettre à jour
```javascript
// AVANT
await base44.entities.OrderItem.update(id, { delivered: true });

// APRÈS
const { error } = await supabase
  .from('order_lines')
  .update({ prep_status: 'delivered', delivered_at: new Date().toISOString() })
  .eq('id', id);
```

### Supprimer
```javascript
// AVANT
await base44.entities.Event.delete(id);

// APRÈS
const { error } = await supabase
  .from('events')
  .delete()
  .eq('id', id);
```

## Auth

```javascript
// AVANT
const user = await base44.auth.me();
base44.auth.logout(redirectUrl);
base44.auth.redirectToLogin(redirectUrl);

// APRÈS
const { data: { user } } = await supabase.auth.getUser();
await supabase.auth.signOut();
await supabase.auth.signInWithPassword({ email, password });
// ou Magic Link :
await supabase.auth.signInWithOtp({ email });
```

## React Query patterns

```javascript
// AVANT
const { data: events } = useQuery({
  queryKey: ['events'],
  queryFn: () => base44.entities.Event.filter({ is_active: true }),
  initialData: []
});

// APRÈS
const { data: events = [] } = useQuery({
  queryKey: ['events', 'active'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data;
  }
});
```

## Mapping entités Base44 → Tables Supabase

| Base44 Entity | Table Supabase | Notes |
|---------------|----------------|-------|
| `Event` | `events` | Identique |
| `MenuItem` | `menu_items` | + `slot_menu_items` pour midi/soir |
| `Order` | `orders` | Champs renommés (snake_case) |
| `OrderItem` | `order_lines` | Refactoré : 1 ligne = 1 plat (pas 1 jour) |
| _(nouveau)_ | `meal_slots` | Créneaux midi/soir par jour |
| _(nouveau)_ | `profiles` | Rôles admin/staff/customer |

## Changement majeur : OrderItem → order_lines

### AVANT (Base44) : 1 OrderItem = 1 jour complet
```javascript
{
  order_id: 123,
  day_date: '2026-03-15',
  entree_id: 'a', entree_name: 'Salade César',
  plat_id: 'b', plat_name: 'Boeuf bourguignon',
  dessert_id: 'c', dessert_name: 'Crème brûlée',
  boisson_id: 'd', boisson_name: 'Eau plate',
  day_total: 28.50,
  delivered: false
}
```

### APRÈS (Supabase) : 1 order_line = 1 plat précis
```javascript
// 4 lignes pour le même créneau :
{ order_id: 'uuid', meal_slot_id: 'midi-15mars', menu_item_id: 'salade', unit_price: 6.50, prep_status: 'pending' }
{ order_id: 'uuid', meal_slot_id: 'midi-15mars', menu_item_id: 'boeuf',  unit_price: 14.00, prep_status: 'preparing' }
{ order_id: 'uuid', meal_slot_id: 'midi-15mars', menu_item_id: 'creme',  unit_price: 5.00, prep_status: 'ready' }
{ order_id: 'uuid', meal_slot_id: 'midi-15mars', menu_item_id: 'eau',    unit_price: 3.00, prep_status: 'delivered' }
```

**Avantages** : chaque plat a son propre statut de préparation, 
la cuisine peut traiter plat par plat, requêtes SQL simples pour les stats.
