import { useState, useCallback } from "react";

const C = {
  rose: "#8B3A43", vr: "#BF646D", poudre: "#E5B7B3", olive: "#968A42",
  cream: "#F0F0E6", dark: "#392D31", white: "#FDFAF7", border: "#E5D9D0",
  muted: "#9A8A7C", green: "#4A7C59", orange: "#C4793A", red: "#A63D40",
  blue: "#4A6FA5",
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

const COLUMNS = [
  { key: "pending", label: "En attente", color: C.muted, icon: "◷", bg: `${C.muted}10` },
  { key: "preparing", label: "En préparation", color: C.orange, icon: "🔥", bg: `${C.orange}10` },
  { key: "ready", label: "Prêts", color: C.olive, icon: "✓", bg: `${C.olive}10` },
  { key: "delivered", label: "Livrés", color: C.green, icon: "🚚", bg: `${C.green}08` },
];

const TYPE_ICONS = { entree: "🥗", plat: "🍽", dessert: "🍰", boisson: "🥤" };

const INIT_ORDERS = [
  { id: 1, order: "CMD-001847", stand: "A-12", name: "Sophie Martin", slot: "midi", items: [
    { id: 101, name: "Velouté de butternut", type: "entree", status: "preparing", qty: 1 },
    { id: 102, name: "Suprême de volaille", type: "plat", status: "pending", qty: 1 },
    { id: 103, name: "Crème brûlée vanille", type: "dessert", status: "pending", qty: 1 },
    { id: 104, name: "Eau minérale", type: "boisson", status: "ready", qty: 1 },
  ]},
  { id: 2, order: "CMD-001846", stand: "B-08", name: "Pierre Dubois", slot: "midi", items: [
    { id: 201, name: "Tartare de saumon", type: "entree", status: "ready", qty: 1 },
    { id: 202, name: "Dos de cabillaud", type: "plat", status: "preparing", qty: 1 },
    { id: 203, name: "Fondant au chocolat", type: "dessert", status: "pending", qty: 1 },
    { id: 204, name: "Café ou thé", type: "boisson", status: "pending", qty: 2 },
  ]},
  { id: 3, order: "CMD-001845", stand: "C-22", name: "Marie Laurent", slot: "midi", items: [
    { id: 301, name: "Salade de chèvre chaud", type: "entree", status: "delivered", qty: 1 },
    { id: 302, name: "Risotto aux cèpes", type: "plat", status: "ready", qty: 1 },
    { id: 303, name: "Panna cotta framboise", type: "dessert", status: "preparing", qty: 1 },
    { id: 304, name: "Jus de fruits frais", type: "boisson", status: "delivered", qty: 1 },
  ]},
  { id: 4, order: "CMD-001844", stand: "A-05", name: "Jean Moreau", slot: "soir", items: [
    { id: 401, name: "Velouté de butternut", type: "entree", status: "pending", qty: 2 },
    { id: 402, name: "Suprême de volaille", type: "plat", status: "pending", qty: 2 },
    { id: 403, name: "Fondant au chocolat", type: "dessert", status: "pending", qty: 2 },
  ]},
  { id: 5, order: "CMD-001843", stand: "D-14", name: "Claire Petit", slot: "midi", items: [
    { id: 501, name: "Tartare de saumon", type: "entree", status: "preparing", qty: 1 },
    { id: 502, name: "Dos de cabillaud", type: "plat", status: "pending", qty: 1 },
    { id: 503, name: "Crème brûlée vanille", type: "dessert", status: "pending", qty: 1 },
  ]},
];

const NEXT_STATUS = { pending: "preparing", preparing: "ready", ready: "delivered" };

function PrepCard({ item, orderInfo, onAdvance }) {
  const col = COLUMNS.find((c) => c.key === item.status);
  const canAdvance = NEXT_STATUS[item.status];
  const nextCol = canAdvance ? COLUMNS.find((c) => c.key === canAdvance) : null;

  return (
    <div style={{
      background: "white", borderRadius: 14, border: `1px solid ${C.border}`,
      padding: "14px 14px", transition: "all 0.3s", cursor: "default",
      borderLeft: `3px solid ${col.color}`,
    }}>
      {/* Order ref */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={sans(11, { color: C.rose, bold: true })}>{orderInfo.order}</span>
          <span style={{
            ...sans(9, { upper: true, tracking: "0.06em", color: C.muted }),
            padding: "2px 7px", borderRadius: 50, background: C.cream,
          }}>{orderInfo.stand}</span>
        </div>
        <span style={{
          ...sans(9, { upper: true, tracking: "0.06em", color: orderInfo.slot === "midi" ? C.olive : C.vr }),
          padding: "2px 7px", borderRadius: 50,
          background: orderInfo.slot === "midi" ? `${C.olive}15` : `${C.poudre}40`,
        }}>
          {orderInfo.slot === "midi" ? "☀ midi" : "☽ soir"}
        </span>
      </div>

      {/* Item details */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{TYPE_ICONS[item.type] || "●"}</span>
        <div>
          <div style={sans(14, { color: C.dark, bold: true })}>{item.name}</div>
          <div style={sans(11, { color: C.muted })}>
            {item.qty > 1 ? `×${item.qty}` : ""} · {orderInfo.name}
          </div>
        </div>
      </div>

      {/* Advance button */}
      {canAdvance && (
        <button onClick={() => onAdvance(orderInfo.id, item.id)} style={{
          width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 50,
          border: `1.5px solid ${nextCol.color}`, background: `${nextCol.color}10`,
          cursor: "pointer", transition: "all 0.2s",
          ...sans(11, { upper: true, tracking: "0.08em", color: nextCol.color, bold: true }),
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <span>{nextCol.icon}</span> {nextCol.label} →
        </button>
      )}
    </div>
  );
}

export default function KitchenView() {
  const [orders, setOrders] = useState(INIT_ORDERS);
  const [slotFilter, setSlotFilter] = useState("all");
  const [viewMode, setViewMode] = useState("kanban"); // kanban | list

  const advanceItem = useCallback((orderId, itemId) => {
    setOrders((prev) => prev.map((o) =>
      o.id === orderId
        ? { ...o, items: o.items.map((i) => i.id === itemId ? { ...i, status: NEXT_STATUS[i.status] || i.status } : i) }
        : o
    ));
  }, []);

  // Flatten all items with order info
  const allItems = orders.flatMap((o) =>
    o.items
      .filter((i) => slotFilter === "all" || o.slot === slotFilter)
      .map((i) => ({ ...i, orderInfo: { id: o.id, order: o.order, stand: o.stand, name: o.name, slot: o.slot } }))
  );

  const columnItems = (status) => allItems.filter((i) => i.status === status);

  // Stats
  const totalItems = allItems.length;
  const delivered = allItems.filter((i) => i.status === "delivered").length;
  const progress = totalItems > 0 ? Math.round((delivered / totalItems) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.poudre}; border-radius: 4px; }
      `}</style>

      {/* Staff top bar */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 24px", background: "white", borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={sans(9, { upper: true, tracking: "0.3em", color: C.vr })}>Maison</div>
            <div style={serif(18, { color: C.rose })}>Félicien</div>
          </div>
          <div style={{ width: 1, height: 32, background: C.border }} />
          <div style={{
            ...sans(10, { upper: true, tracking: "0.1em", color: C.orange }),
            padding: "4px 12px", borderRadius: 50, background: `${C.orange}12`,
          }}>
            🍳 Cuisine
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
            <div style={{ width: 120, height: 6, borderRadius: 3, background: C.cream }}>
              <div style={{ height: "100%", borderRadius: 3, background: C.green, width: `${progress}%`, transition: "width 0.5s" }} />
            </div>
            <span style={sans(12, { color: C.green, bold: true })}>{progress}%</span>
          </div>

          {/* Slot filter */}
          <div style={{ display: "inline-flex", borderRadius: 50, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {[
              { key: "all", label: "Tous" },
              { key: "midi", label: "☀ Midi" },
              { key: "soir", label: "☽ Soir" },
            ].map((s) => (
              <button key={s.key} onClick={() => setSlotFilter(s.key)} style={{
                ...sans(11, { upper: true, tracking: "0.06em", color: slotFilter === s.key ? C.cream : C.muted }),
                padding: "7px 14px", border: "none",
                background: slotFilter === s.key ? C.rose : "transparent",
                cursor: "pointer", transition: "all 0.25s",
              }}>{s.label}</button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 2 }}>
            {["kanban", "list"].map((v) => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                background: viewMode === v ? C.rose : "white",
                color: viewMode === v ? C.cream : C.muted,
                cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {v === "kanban" ? "▦" : "≡"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: "20px 20px", minHeight: "calc(100vh - 60px)" }}>
          {COLUMNS.map((col) => {
            const items = columnItems(col.key);
            return (
              <div key={col.key} style={{ display: "flex", flexDirection: "column" }}>
                {/* Column header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: "14px 14px 0 0",
                  background: col.bg, borderBottom: `2px solid ${col.color}30`,
                  marginBottom: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{col.icon}</span>
                    <span style={sans(12, { upper: true, tracking: "0.1em", color: col.color, bold: true })}>{col.label}</span>
                  </div>
                  <span style={{
                    ...sans(12, { color: col.color, bold: true }),
                    width: 26, height: 26, borderRadius: "50%", background: `${col.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{items.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {items.map((item, i) => (
                    <div key={item.id} style={{ animation: `slideIn 0.3s ease ${i * 0.05}s both` }}>
                      <PrepCard item={item} orderInfo={item.orderInfo} onAdvance={advanceItem} />
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div style={{
                      textAlign: "center", padding: "32px 16px", borderRadius: 14,
                      border: `1.5px dashed ${C.border}`, color: C.muted, fontSize: 13,
                    }}>
                      Aucun élément
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div style={{ padding: "20px 24px", maxWidth: 900, margin: "0 auto" }}>
          {COLUMNS.filter((c) => c.key !== "delivered").map((col) => {
            const items = columnItems(col.key);
            if (items.length === 0) return null;
            return (
              <div key={col.key} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={sans(12, { upper: true, tracking: "0.12em", color: col.color, bold: true })}>{col.label}</span>
                  <span style={{ ...sans(11, { color: col.color }), padding: "2px 8px", borderRadius: 50, background: `${col.color}15` }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((item) => (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      background: "white", borderRadius: 12, border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${col.color}`,
                    }}>
                      <span style={{ fontSize: 16 }}>{TYPE_ICONS[item.type]}</span>
                      <div style={{ flex: 1 }}>
                        <span style={sans(14, { color: C.dark, bold: true })}>{item.name}</span>
                        {item.qty > 1 && <span style={sans(12, { color: C.muted })}> ×{item.qty}</span>}
                      </div>
                      <span style={sans(12, { color: C.muted })}>{item.orderInfo.name}</span>
                      <span style={sans(11, { color: C.dark })}>{item.orderInfo.stand}</span>
                      {NEXT_STATUS[item.status] && (
                        <button onClick={() => advanceItem(item.orderInfo.id, item.id)} style={{
                          ...sans(10, { upper: true, tracking: "0.06em", color: C.cream }),
                          padding: "6px 14px", borderRadius: 50, background: COLUMNS.find((c) => c.key === NEXT_STATUS[item.status]).color,
                          border: "none", cursor: "pointer",
                        }}>
                          {COLUMNS.find((c) => c.key === NEXT_STATUS[item.status]).label} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
