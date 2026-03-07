import { useState } from "react";

const C = {
  rose: "#8B3A43", vr: "#BF646D", poudre: "#E5B7B3", olive: "#968A42",
  cream: "#F0F0E6", dark: "#392D31", white: "#FDFAF7", border: "#E5D9D0",
  muted: "#9A8A7C", green: "#4A7C59", orange: "#C4793A", red: "#A63D40",
};

const sans = (sz, opts = {}) => ({
  fontFamily: "'Questrial', sans-serif", fontSize: sz,
  fontWeight: opts.bold ? 600 : 400, color: opts.color || C.dark,
  letterSpacing: opts.tracking || 0, textTransform: opts.upper ? "uppercase" : "none",
});
const serif = (sz, opts = {}) => ({
  fontFamily: "'Georgia', serif", fontSize: sz, fontWeight: 400,
  fontStyle: "italic", color: opts.color || C.rose,
});

const CATEGORIES = [
  { key: "entree", label: "Entrées", icon: "🥗" },
  { key: "plat", label: "Plats", icon: "🍽" },
  { key: "dessert", label: "Desserts", icon: "🍰" },
  { key: "boisson", label: "Boissons", icon: "🥤" },
];

const INIT_ITEMS = [
  { id: 1, name: "Velouté de butternut", type: "entree", price: 8.5, desc: "Noisettes torréfiées, crème d'estragon", tags: ["Végétarien"], available: true, midi: true, soir: true },
  { id: 2, name: "Tartare de saumon", type: "entree", price: 10, desc: "Agrumes, avocat, sésame noir", tags: ["Sans gluten"], available: true, midi: true, soir: false },
  { id: 3, name: "Salade de chèvre chaud", type: "entree", price: 9, desc: "Miel de lavande, noix de pécan", tags: ["Végétarien"], available: true, midi: true, soir: true },
  { id: 4, name: "Suprême de volaille", type: "plat", price: 16, desc: "Jus corsé, purée truffée, légumes glacés", tags: [], available: true, midi: true, soir: true },
  { id: 5, name: "Dos de cabillaud", type: "plat", price: 18, desc: "Beurre blanc, risotto au safran", tags: ["Sans gluten"], available: true, midi: true, soir: true },
  { id: 6, name: "Risotto aux cèpes", type: "plat", price: 15, desc: "Parmesan 24 mois, roquette", tags: ["Végétarien"], available: false, midi: true, soir: false },
  { id: 7, name: "Crème brûlée vanille", type: "dessert", price: 7, desc: "Gousse de Madagascar", tags: ["Sans gluten"], available: true, midi: true, soir: true },
  { id: 8, name: "Fondant au chocolat", type: "dessert", price: 8, desc: "Cœur coulant, glace vanille", tags: [], available: true, midi: true, soir: true },
  { id: 9, name: "Panna cotta framboise", type: "dessert", price: 7.5, desc: "Coulis frais, éclats de pistache", tags: ["Sans gluten"], available: true, midi: false, soir: true },
  { id: 10, name: "Eau minérale", type: "boisson", price: 3, desc: "Plate ou gazeuse, 50cl", tags: [], available: true, midi: true, soir: true },
  { id: 11, name: "Jus de fruits frais", type: "boisson", price: 4.5, desc: "Orange, pomme ou pamplemousse", tags: ["Végan"], available: true, midi: true, soir: true },
  { id: 12, name: "Café ou thé", type: "boisson", price: 3.5, desc: "Sélection artisanale", tags: [], available: true, midi: true, soir: true },
];

function Toggle({ value, onChange, label }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
      cursor: "pointer", ...sans(12, { color: value ? C.dark : C.muted }),
    }}>
      <div style={{
        width: 36, height: 20, borderRadius: 10, padding: 2,
        background: value ? C.rose : C.border, transition: "all 0.25s",
        display: "flex", alignItems: "center",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", background: "white",
          transform: value ? "translateX(16px)" : "translateX(0)", transition: "transform 0.25s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </div>
      {label}
    </button>
  );
}

function SlotBadge({ midi, soir }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {midi && <span style={{ ...sans(9, { upper: true, tracking: "0.06em", color: C.olive }), padding: "2px 7px", borderRadius: 50, background: `${C.olive}15` }}>☀ Midi</span>}
      {soir && <span style={{ ...sans(9, { upper: true, tracking: "0.06em", color: C.vr }), padding: "2px 7px", borderRadius: 50, background: `${C.poudre}40` }}>☽ Soir</span>}
    </div>
  );
}

function ItemCard({ item, onEdit, onToggle }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      background: "white", borderRadius: 14, border: `1px solid ${C.border}`,
      opacity: item.available ? 1 : 0.55, transition: "all 0.3s",
    }}>
      {/* Drag handle */}
      <div style={{ cursor: "grab", color: C.border, fontSize: 16, lineHeight: 1 }}>⠿</div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={sans(14, { color: C.dark, bold: true })}>{item.name}</span>
          {!item.available && (
            <span style={{ ...sans(9, { upper: true, tracking: "0.06em", color: C.red }), padding: "1px 7px", borderRadius: 50, background: `${C.red}12` }}>
              Indisponible
            </span>
          )}
        </div>
        <div style={sans(12, { color: C.muted })}>{item.desc}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
          <SlotBadge midi={item.midi} soir={item.soir} />
          {item.tags.map((t) => (
            <span key={t} style={{ ...sans(9, { color: C.olive }), padding: "1px 6px", borderRadius: 50, background: `${C.olive}10` }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right", minWidth: 70 }}>
        <div style={sans(16, { color: C.rose, bold: true })}>{item.price.toFixed(2)} €</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onToggle(item.id)} style={{
          width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
          background: "white", cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: item.available ? C.green : C.muted, transition: "all 0.2s",
        }}>
          {item.available ? "●" : "○"}
        </button>
        <button onClick={() => onEdit(item)} style={{
          width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
          background: "white", cursor: "pointer", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center", color: C.rose,
        }}>
          ✎
        </button>
      </div>
    </div>
  );
}

function EditModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ ...item });
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(57,45,49,0.3)" }} />
      <div style={{
        position: "relative", background: "white", borderRadius: 20, padding: "28px 26px",
        width: 460, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(57,45,49,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={serif(22, { color: C.rose })}>{item.id ? "Modifier" : "Nouveau plat"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: C.muted, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={sans(10, { upper: true, tracking: "0.12em", color: C.rose })}>Nom du plat</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ ...sans(15), width: "100%", padding: "10px 16px", borderRadius: 50, border: `1px solid ${C.border}`, outline: "none", marginTop: 5 }} />
          </div>
          <div>
            <label style={sans(10, { upper: true, tracking: "0.12em", color: C.rose })}>Description</label>
            <input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })}
              style={{ ...sans(14), width: "100%", padding: "10px 16px", borderRadius: 50, border: `1px solid ${C.border}`, outline: "none", marginTop: 5 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={sans(10, { upper: true, tracking: "0.12em", color: C.rose })}>Catégorie</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ ...sans(13), width: "100%", padding: "10px 16px", borderRadius: 50, border: `1px solid ${C.border}`, background: "white", marginTop: 5 }}>
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={sans(10, { upper: true, tracking: "0.12em", color: C.rose })}>Prix (€)</label>
              <input type="number" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                style={{ ...sans(15), width: "100%", padding: "10px 16px", borderRadius: 50, border: `1px solid ${C.border}`, outline: "none", marginTop: 5 }} />
            </div>
          </div>
          <div>
            <label style={{ ...sans(10, { upper: true, tracking: "0.12em", color: C.rose }), marginBottom: 8, display: "block" }}>Services</label>
            <div style={{ display: "flex", gap: 20 }}>
              <Toggle value={form.midi} onChange={(v) => setForm({ ...form, midi: v })} label="☀ Midi" />
              <Toggle value={form.soir} onChange={(v) => setForm({ ...form, soir: v })} label="☽ Soir" />
            </div>
          </div>
          <Toggle value={form.available} onChange={(v) => setForm({ ...form, available: v })} label="Disponible à la commande" />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          <button onClick={onClose} style={{
            flex: 1, ...sans(12, { upper: true, tracking: "0.1em", color: C.dark }),
            padding: "12px 0", borderRadius: 50, border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer",
          }}>Annuler</button>
          <button onClick={() => { onSave(form); onClose(); }} style={{
            flex: 2, ...sans(12, { upper: true, tracking: "0.1em", color: C.cream }),
            padding: "12px 0", borderRadius: 50, border: "none", background: C.rose, cursor: "pointer", fontWeight: 500,
          }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

export default function MenuBuilder() {
  const [items, setItems] = useState(INIT_ITEMS);
  const [activeCat, setActiveCat] = useState("entree");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = items.filter((i) => i.type === activeCat && i.name.toLowerCase().includes(search.toLowerCase()));
  const catCounts = CATEGORIES.map((c) => ({ ...c, count: items.filter((i) => i.type === c.key).length }));

  const toggleAvailable = (id) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, available: !i.available } : i));
  };

  const saveItem = (updated) => {
    setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, padding: "28px 32px", marginLeft: 220 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: ${C.muted}; }
        button:active { transform: scale(0.98); }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ ...serif(30, { color: C.rose }), margin: "0 0 4px" }}>La Carte</h1>
          <p style={sans(13, { color: C.muted })}>Salon du Bâtiment · {items.length} plats au catalogue</p>
        </div>
        <button onClick={() => setEditing({ id: Date.now(), name: "", desc: "", type: activeCat, price: 0, tags: [], available: true, midi: true, soir: false })}
          style={{
            ...sans(11, { upper: true, tracking: "0.1em", color: C.cream }),
            padding: "10px 22px", borderRadius: 50, background: C.rose, border: "none", cursor: "pointer",
          }}>
          + Ajouter un plat
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {catCounts.map((c) => (
          <button key={c.key} onClick={() => setActiveCat(c.key)} style={{
            ...sans(12, { color: activeCat === c.key ? C.cream : C.dark }),
            padding: "9px 18px", borderRadius: 50,
            background: activeCat === c.key ? C.rose : "white",
            border: `1.5px solid ${activeCat === c.key ? C.rose : C.border}`,
            cursor: "pointer", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{c.icon}</span> {c.label}
            <span style={{
              ...sans(10, { color: activeCat === c.key ? C.poudre : C.muted }),
              padding: "1px 7px", borderRadius: 50,
              background: activeCat === c.key ? `${C.dark}30` : C.cream,
            }}>{c.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Rechercher un plat..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            ...sans(14), padding: "10px 18px", borderRadius: 50, border: `1px solid ${C.border}`,
            background: "white", outline: "none", width: 300,
          }} />
      </div>

      {/* Items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} onEdit={setEditing} onToggle={toggleAvailable} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>❋</div>
            <div style={sans(14, { color: C.muted })}>Aucun plat dans cette catégorie</div>
          </div>
        )}
      </div>

      {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSave={saveItem} />}
    </div>
  );
}
