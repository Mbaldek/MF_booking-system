# 🎨 Design System — Maison Félicien

## Sources d'inspiration
- **Charte graphique MF** par Charlotte Mandinaud
- **Monte Newcastle** (monte.net.au) — restaurant premium, booking épuré
- **Shopify** — sélection produits claire
- **Maze** — formulaire de paiement propre

---

## Palette de couleurs

| Token | Hex | Usage |
|-------|-----|-------|
| `--mf-rose` | `#8B3A43` | Couleur primaire — titres, boutons, accents |
| `--mf-vieux-rose` | `#BF646D` | Labels, sous-titres, icônes secondaires |
| `--mf-poudre` | `#E5B7B3` | Fonds actifs légers, badges, hover states |
| `--mf-vert-olive` | `#968A42` | Tags (régimes, allergènes), accents nature |
| `--mf-blanc-casse` | `#F0F0E6` | Background principal de page |
| `--mf-marron-glace` | `#392D31` | Texte courant, titres sombres |
| `--mf-white` | `#FDFAF7` | Background cartes, inputs |
| `--mf-border` | `#E5D9D0` | Bordures, séparateurs |
| `--mf-muted` | `#9A8A7C` | Texte secondaire, descriptions |
| `--mf-muted-light` | `#C4B5A8` | Placeholders |

### Règle : jamais de bleu, pas de gris froid. Tout est chaud, terreux, organique.

---

## Typographies

### Ariens Nobela (display)
- **Usage** : Logo, grands titres
- **Style** : Ornementale, fine, majuscules
- **Fallback web** : `'Georgia', 'Times New Roman', serif` avec `font-style: italic`
- **Fichiers** : `AriensNobela.otf`, `AriensNobela.ttf`
- ⚠ Trop fine en petit — réserver aux tailles > 28px

### Questrial (corps)
- **Usage** : Sous-titres (uppercase + letter-spacing), texte courant, boutons, labels
- **Style** : Linéale, contrastante, aérée
- **Import** : Google Fonts `https://fonts.googleapis.com/css2?family=Questrial`
- **Fichier** : `Questrial-Regular.ttf`

### Hiérarchie typographique
```css
/* Grands titres */
.mf-title {
  font-family: 'Ariens Nobela', 'Georgia', serif;
  font-size: 32px;
  font-weight: 400;
  color: var(--mf-rose);
}

/* Sous-titres */
.mf-subtitle {
  font-family: 'Questrial', sans-serif;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--mf-vieux-rose);
}

/* Labels de formulaire */
.mf-label {
  font-family: 'Questrial', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--mf-rose);
}

/* Texte courant */
.mf-body {
  font-family: 'Questrial', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--mf-marron-glace);
}

/* Prix */
.mf-price {
  font-family: 'Georgia', serif;
  font-size: 24px;
  font-style: italic;
  color: var(--mf-rose);
}
```

---

## Composants clés

### Inputs (style Monte)
- `border-radius: 50px` (pill shape)
- `border: 1px solid var(--mf-border)`
- `padding: 12px 18px`
- Focus : `border-color: var(--mf-rose)`
- Background : `white` (pas blanc cassé)

### Boutons primaires
- `border-radius: 50px`
- `background: var(--mf-rose)`
- `color: var(--mf-blanc-casse)`
- `text-transform: uppercase`
- `letter-spacing: 0.12em`
- `font-size: 13px`
- Hover : `opacity: 0.92`

### Boutons secondaires
- `border: 1.5px solid var(--mf-border)`
- `background: white`
- `color: var(--mf-marron-glace)`
- Même shape pill

### Cards
- `border-radius: 20px`
- `border: 1px solid var(--mf-border)`
- `background: white`
- `padding: 24px`
- Sélectionnée : `border-color: var(--mf-rose)`, fond léger poudré

### Day chips
- Pill shape (50px radius)
- Non sélectionné : blanc + bordure
- Sélectionné : `background: var(--mf-rose)`, texte clair

### Slot toggle (Midi/Soir)
- Pill container avec 2 options
- Actif : fond rose, texte clair
- Inactif : transparent, texte vieux-rose

### Tags (allergènes/régimes)
- Très petit (10px uppercase)
- `background: var(--mf-vert-olive)18` (18 = opacity hex)
- `color: var(--mf-vert-olive)`
- Pill shape

---

## Mise en page

### Background
- Page : `var(--mf-blanc-casse)` (#F0F0E6)
- Cartes/sections : `white`
- Header : `white` avec bordure basse

### Espacement
- Beaucoup d'air (style Monte)
- Sections : `gap: 24px`
- Éléments dans une section : `gap: 12-16px`
- Padding cartes : `24-28px`

### Mobile-first
- Max-width container : `520px`
- Footer sticky pour le total/paiement
- Scroll horizontal pour les tabs jours

---

## Logo usage dans l'app
- **Header** : Symbole floral (petit) + "MAISON" en uppercase Questrial + "Félicien" en Georgia italic
- **Admin sidebar** : Monogramme MF (petit)
- **Favicon** : Symbole floral

### Fichiers SVG disponibles
- `Logo_Rose.svg` / `Logo_Poudré.svg` / `Logo_Blanc-cassé.svg`
- `Monogramme-Rose.svg` / `Monogramme-Poudré.svg` / `Monogramme-Blanc-cassé.svg`
- `Symbole-Rose.svg` / `Symbole-Poudré.svg` / `Symbole-Blanc-cassé.svg`

---

## Principes de design

1. **Épuré > Chargé** — Laisser respirer. Beaucoup de blanc cassé.
2. **Organique > Géométrique** — Coins arrondis (20px cards, 50px boutons), pas de coins droits.
3. **Chaud > Froid** — Tous les gris sont teintés chauds. Zéro gris bleuté.
4. **Premium > Flashy** — Pas d'ombre portée lourde. Bordures subtiles. Transitions douces.
5. **Lisibilité** — Questrial en corps, bon interlignage, contrastes suffisants.
6. **Cohérence** — Réutiliser les mêmes 6 couleurs partout. Pas de couleur ad hoc.

---

## Tailwind config à ajouter

```javascript
// tailwind.config.js — extend colors
colors: {
  mf: {
    rose: '#8B3A43',
    'vieux-rose': '#BF646D',
    poudre: '#E5B7B3',
    'vert-olive': '#968A42',
    'blanc-casse': '#F0F0E6',
    'marron-glace': '#392D31',
  }
}
```
