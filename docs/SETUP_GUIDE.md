# 🚀 Guide de setup — Event Eats (Local)

## Prérequis
- Node.js 18+
- VS Code + extension Claude Code
- Git
- Compte Supabase (gratuit) : https://supabase.com
- Compte Stripe (mode test) : https://dashboard.stripe.com
- (Optionnel) Supabase CLI : `npm install -g supabase`

---

## Étape 1 — Créer le repo Git

```bash
mkdir event-eats && cd event-eats
git init
```

Copier le contenu de ce kit dans le repo.

---

## Étape 2 — Créer le projet Supabase

1. Aller sur https://supabase.com/dashboard
2. "New Project" dans l'org RotaryParis
3. Nom : `event-eats` | Région : `eu-west-3` (Paris) | Mot de passe DB : noter
4. Attendre l'initialisation (~2 min)
5. Aller dans Settings > API et copier :
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`

---

## Étape 3 — Appliquer le schéma SQL

### Option A : Via le dashboard Supabase
1. Aller dans SQL Editor
2. Coller le contenu de `supabase/migrations/001_initial_schema.sql`
3. Exécuter

### Option B : Via Supabase CLI
```bash
npx supabase login
npx supabase link --project-ref <ton-project-ref>
npx supabase db push
```

---

## Étape 4 — Configurer l'auth Supabase

Dans le dashboard Supabase > Authentication > Providers :
1. Activer **Email** (activé par défaut)
2. (Optionnel) Activer **Google** ou **Magic Link**

Créer le premier admin manuellement :
1. Authentication > Users > "Add User"
2. Créer un user avec email/password
3. Dans SQL Editor, exécuter :
```sql
INSERT INTO profiles (user_id, role, display_name)
VALUES ('<user-id-from-auth>', 'admin', 'Admin');
```

---

## Étape 5 — Setup du projet React

```bash
# Depuis la racine du projet (copier le frontend existant)
npm install

# Ajouter Supabase
npm install @supabase/supabase-js

# Retirer Base44 (plus nécessaire)
npm uninstall @base44/sdk @base44/vite-plugin

# Créer .env.local
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
EOF

# Lancer
npm run dev
```

---

## Étape 6 — Ouvrir dans VS Code + Claude Code

```bash
code .
```

Dans le terminal VS Code :
```bash
claude
```

Claude Code va automatiquement lire le fichier `CLAUDE.md` à la racine
et comprendre tout le contexte du projet.

### Premier prompt suggéré pour Claude Code :

```
Lis CLAUDE.md et le schéma SQL dans supabase/migrations/.
Ensuite :
1. Crée src/api/supabase.js (client Supabase)
2. Crée src/hooks/useAuth.js (remplacer AuthContext Base44)
3. Crée src/lib/AuthContext.jsx (provider Supabase)
4. Migre src/pages/Order.jsx pour utiliser Supabase au lieu de Base44
```

---

## Étape 7 — Stripe (Phase 3)

1. Créer un compte Stripe test : https://dashboard.stripe.com/test
2. Copier la clé publishable → `.env.local`
3. Créer une Edge Function Supabase pour le checkout :
   ```bash
   npx supabase functions new create-checkout
   ```
4. Configurer le webhook Stripe → Edge Function

---

## Structure finale attendue

```
event-eats/
├── CLAUDE.md                  ← Contexte pour Claude Code
├── .env.local                 ← Variables Supabase + Stripe
├── package.json
├── vite.config.js
├── index.html
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── api/supabase.js        ← À créer
│   ├── hooks/                 ← À créer
│   ├── lib/
│   │   ├── AuthContext.jsx    ← À migrer
│   │   └── RoleGuard.jsx      ← À créer
│   ├── components/            ← Existant (garder)
│   ├── pages/                 ← À migrer un par un
│   └── docs/
│       └── original-base44/   ← Copie du code Base44 pour référence
```

---

## Ordre de migration recommandé

| # | Fichier | Priorité | Complexité |
|---|---------|----------|------------|
| 1 | `src/api/supabase.js` | 🔴 | Facile |
| 2 | `src/lib/AuthContext.jsx` | 🔴 | Moyenne |
| 3 | `src/lib/RoleGuard.jsx` | 🔴 | Facile |
| 4 | `src/pages/Order.jsx` | 🔴 | Haute |
| 5 | `src/pages/AdminEvent.jsx` | 🟡 | Moyenne |
| 6 | `src/pages/AdminMenu.jsx` | 🟡 | Moyenne |
| 7 | `src/pages/AdminOrders.jsx` | 🟡 | Haute |
| 8 | `src/pages/StaffKitchen.jsx` | 🟢 | Haute |
| 9 | `src/pages/Delivery.jsx` | 🟢 | Moyenne |
| 10 | Edge Function Stripe | 🟢 | Moyenne |
