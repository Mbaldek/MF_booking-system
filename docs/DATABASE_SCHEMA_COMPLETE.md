# Schéma Base de Données — Module Réservation

## Tables Overview

```sql
events
  ├─ restaurant_floors
  │  └─ restaurant_tables
  │     └─ meal_tours (via meal_shifts)
  │        └─ reservations
  └─ meal_shifts
     └─ meal_tours
        └─ reservations
```

---

## Détail Complet des Tables

### **events** (existing)
```
id              UUID PK
name            TEXT
start_date      DATE
end_date        DATE
description     TEXT
is_active       BOOLEAN
meal_service    VARCHAR ('midi' | 'soir' | 'both')
menu_price_midi DECIMAL
menu_price_soir DECIMAL
created_at      TIMESTAMPTZ
```

---

### **restaurant_floors** (NEW)
Représente les zones/plans de la salle pour un événement.

```sql
CREATE TABLE restaurant_floors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Exemples** :
- "Salle principale"
- "Terrasse"
- "Patio extérieur"
- "Salon privé"

**Indices** :
```sql
CREATE INDEX idx_floors_event ON restaurant_floors(event_id);
```

---

### **restaurant_tables** (NEW)
Tables individuelles du restaurant, positionnées sur un plan.

```sql
CREATE TABLE restaurant_tables (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        UUID NOT NULL REFERENCES restaurant_floors(id) ON DELETE CASCADE,
  "number"        INTEGER NOT NULL,
  seats           INTEGER NOT NULL CHECK (seats > 0),
  x               NUMERIC,  -- Coordonnée X pour rendu visuel (optionnel)
  y               NUMERIC,  -- Coordonnée Y pour rendu visuel (optionnel)
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Exemples** :
```
Floor: Salle principale
  - Table 1 (2 seats)
  - Table 2 (4 seats)
  - Table 3 (6 seats)
  - Table 4 (8 seats)
  ...

Floor: Terrasse
  - Table 20 (2 seats)
  - Table 21 (4 seats)
```

**Indices** :
```sql
CREATE INDEX idx_tables_floor ON restaurant_tables(floor_id);
```

---

### **meal_shifts** (NEW)
Définit les services (midi, soir) avec horaires et intervalle des créneaux.

```sql
CREATE TABLE meal_shifts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,  -- "Midi", "Soir", "Petit déj", etc.
  start_time              TIME NOT NULL,  -- "11:30"
  end_time                TIME NOT NULL,  -- "14:30"
  slot_interval_minutes   INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes > 0),
  created_at              TIMESTAMPTZ DEFAULT now()
);
```

**Exemples** :
```
Event: "Salon Gastronomie 2026"
  - Shift: Midi (11:30 — 14:30, créneaux 30min)
  - Shift: Soir (19:00 — 23:00, créneaux 30min)
```

**Signification** :
- `slot_interval_minutes = 30` → tours générés à 11:30, 12:00, 12:30, 13:00, 13:30, 14:00
- `slot_interval_minutes = 45` → tours générés à 11:30, 12:15, 13:00, 13:45

---

### **meal_tours** (NEW)
Créneaux horaires disponibles pour une réservation, générés à partir du shift.

```sql
CREATE TABLE meal_tours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id        UUID NOT NULL REFERENCES meal_shifts(id) ON DELETE CASCADE,
  start_time      TIME NOT NULL,  -- "12:00"
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Exemples** :
```
Shift: Midi
  - Tour 1: 11:30 (45 min)
  - Tour 2: 12:00 (45 min)
  - Tour 3: 12:30 (45 min)
  - Tour 4: 13:00 (45 min)
  - Tour 5: 13:30 (45 min)
  - Tour 6: 14:00 (45 min)

Shift: Soir
  - Tour 1: 19:00 (60 min)
  - Tour 2: 20:00 (60 min)
  - Tour 3: 21:00 (60 min)
  - Tour 4: 22:00 (60 min)
```

**Indices** :
```sql
CREATE INDEX idx_tours_shift ON meal_tours(shift_id);
```

---

### **reservations** (NEW)
Les réservations des clients.

```sql
CREATE TABLE reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id     UUID NOT NULL REFERENCES meal_tours(id) ON DELETE CASCADE,
  table_id    UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  guest_name  TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  seats       INTEGER NOT NULL CHECK (seats > 0),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

**Colonnes** :
- `tour_id` : Créneau réservé
- `table_id` : Table assignée (peut être NULL si pas d'attribution automatique)
- `guest_name` : Nom du client
- `guest_email` : Email pour confirmation
- `seats` : Nombre de couverts demandés
- `created_at` : Timestamp création

**Indices** :
```sql
CREATE INDEX idx_reservations_tour ON reservations(tour_id);
CREATE INDEX idx_reservations_table ON reservations(table_id);
CREATE INDEX idx_reservations_email ON reservations(guest_email);
```

---

## Requêtes Typiques

### 1. Lister tous les plans (admin)
```sql
SELECT * FROM restaurant_floors
WHERE event_id = $1
ORDER BY created_at;
```

### 2. Lister les tables d'un plan
```sql
SELECT * FROM restaurant_tables
WHERE floor_id = $1
ORDER BY "number";
```

### 3. Lister les shifts d'un événement
```sql
SELECT * FROM meal_shifts
WHERE event_id = $1
ORDER BY start_time;
```

### 4. Lister les tours d'un shift
```sql
SELECT * FROM meal_tours
WHERE shift_id = $1
ORDER BY start_time;
```

### 5. Compter les réservations d'un tour
```sql
SELECT COUNT(*) as total_guests
FROM reservations
WHERE tour_id = $1;
```

### 6. Lister les réservations d'un tour
```sql
SELECT r.*, t.start_time, s.name as shift_name
FROM reservations r
JOIN meal_tours t ON r.tour_id = t.id
JOIN meal_shifts s ON t.shift_id = s.id
WHERE r.tour_id = $1
ORDER BY r.created_at;
```

### 7. Vérifier disponibilité d'une table
```sql
SELECT COUNT(*) as reservations_count
FROM reservations
WHERE table_id = $1 AND tour_id = $2;
```

### 8. Exporter réservations (admin)
```sql
SELECT 
  r.guest_name,
  r.guest_email,
  r.seats,
  s.name as service,
  t.start_time as heure,
  tbl."number" as table_number,
  r.created_at
FROM reservations r
JOIN meal_tours t ON r.tour_id = t.id
JOIN meal_shifts s ON t.shift_id = s.id
LEFT JOIN restaurant_tables tbl ON r.table_id = tbl.id
WHERE s.event_id = $1
ORDER BY t.start_time, r.guest_name;
```

---

## RLS (Row Level Security)

### Publique (pas d'auth requise)
- SELECT floors, tables, shifts, tours (lecture seule)
- INSERT reservations (creation anonyme)

### Admin uniquement
- UPDATE/DELETE floors
- UPDATE/DELETE tables  
- UPDATE/DELETE shifts
- UPDATE/DELETE tours

**Exemple RLS** :
```sql
-- Publique peut voir les plans
ALTER TABLE restaurant_floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "floors_select_public" ON restaurant_floors
  FOR SELECT USING (true);

CREATE POLICY "floors_insert_admin" ON restaurant_floors
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Réservations: publique peut créer (anonyme via trigger)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_insert_public" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reservations_select_admin" ON reservations
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

---

## Triggers (Optionnel)

### Auto-Send Email on Reservation
```sql
CREATE OR REPLACE FUNCTION send_reservation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler webhook Resend avec détails réservation
  PERFORM http_post(
    'https://api.resend.com/send',
    jsonb_build_object(
      'email', NEW.guest_email,
      'name', NEW.guest_name,
      'tour_id', NEW.tour_id,
      'table_id', NEW.table_id,
      'seats', NEW.seats
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_email
  AFTER INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION send_reservation_email();
```

---

## Validation & Constraints

| Constraint | Table | Field | Rule |
|-----------|-------|-------|------|
| PK | All | id | UUID unique |
| FK | restaurant_floors | event_id | events(id) |
| FK | restaurant_tables | floor_id | restaurant_floors(id) |
| FK | meal_shifts | event_id | events(id) |
| FK | meal_tours | shift_id | meal_shifts(id) |
| FK | reservations | tour_id | meal_tours(id) |
| FK | reservations | table_id | restaurant_tables(id) |
| CHECK | restaurant_tables | seats | > 0 |
| CHECK | meal_shifts | slot_interval_minutes | > 0 |
| CHECK | meal_tours | duration_minutes | > 0 |
| CHECK | reservations | seats | > 0 |
| NOT NULL | restaurant_floors | name | mandatory |
| NOT NULL | meal_shifts | name, start_time, end_time | mandatory |
| NOT NULL | reservations | tour_id, guest_name, guest_email, seats | mandatory |

---

## Notes

1. **Coordonnées (x, y)** : Optionnelles, pour future intégration CartePM (SVG/Canvas)
2. **Table assignation** : `table_id` optionnel (NULL) pour mode "confirmation libre sans table")
3. **Historique** : Ajouter `updated_at` / `deleted_at` si audit requis
4. **Capacity** : Ajouter `max_seats_per_tour` sur meal_shifts pour limiter overbooking

---

## Migration SQL Complète

Voir `supabase/migrations/010_reservations.sql`

```sql
-- Run this in Supabase or psql
psql -U postgres -d yourdatabase -f 010_reservations.sql

-- Or copy-paste SQL into Supabase editor
```

---
