import { useState, useCallback, useRef } from "react";

/*
 * STAFF KITCHEN — Mobile-First Redesign
 * 
 * Problème : le Kanban 4 colonnes est inutilisable sur mobile.
 * Solution : tabs horizontaux (comme des onglets WhatsApp) + liste verticale.
 * 
 * Principes UX mobile staff :
 * - Une seule colonne visible à la fois (tab active)
 * - Gros boutons touch (min 48px)
 * - Swipe horizontal pour changer d'onglet
 * - Regroupement par COMMANDE (pas par plat isolé) → plus logique en cuisine
 * - Badge compteur sur chaque tab
 * - Action principale toujours en bas (zone pouce)
 */

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

const TABS = [
  { key: "pending", label: "Attente", icon: "◷", color: C.muted },
  { key: "preparing", label: "En cours", icon: "🔥", color: C.orange },
  { key: "ready", label: "Prêts", icon: "✓", color: C.olive },
  { key: "delivered", label: "Livrés", icon: "✓✓", color: C.green },
];

const TYPE_EMOJI = { entree: "🥗", plat: "🍽", dessert: "🍰", boisson: "🥤" };
const NEXT = { pending: "preparing", preparing: "ready", ready: "delivered" };
const NEXT_LABEL = { pending: "Commencer →", preparing: "Prêt ✓", ready: "Livré ✓✓" };
const NEXT_COLOR = { pending: C.orange, preparing: C.olive, ready: C.green };

// Mock orders grouped (realistic: kitchen sees whole orders, not isolated items)
const INIT_ORDERS = [
  {
    id: 1, ref: "CMD-847", stand: "A-12", name: "Sophie Martin", slot: "midi",
    items: [
      { id: 101, name: "Velouté butternut", type: "entree", qty: 1, status: "pending" },
      { id: 102, name: "Suprême de volaille", type: "plat", qty: 1, status: "pending" },
      { id: 103, name: "Crème brûlée", type: "dessert", qty: 1, status: "pending" },
      { id: 104, name: "Eau minérale", type: "boisson", qty: 1, status: "pending" },
    ],
  },
  {
    id: 2, ref: "CMD-846", stand: "B-08", name: "Pierre Dubois", slot: "midi",
    items: [
      { id: 201, name: "Tartare saumon", type: "entree", qty: 1, status: "preparing" },
      { id: 202, name: "Dos de cabillaud", type: "plat", qty: 1, status: "preparing" },
      { id: 203, name: "Fondant chocolat", type: "dessert", qty: 1, status: "pending" },
      { id: 204, name: "Café", type: "boisson", qty: 2, status: "pending" },
    ],
  },
  {
    id: 3, ref: "CMD-845", stand: "C-22", name: "Marie Laurent", slot: "midi",
    items: [
      { id: 301, name: "Salade chèvre chaud", type: "entree", qty: 1, status: "ready" },
      { id: 302, name: "Risotto cèpes", type: "plat", qty: 1, status: "ready" },
      { id: 303, name: "Panna cotta", type: "dessert", qty: 1, status: "preparing" },
      { id: 304, name: "Jus de fruits", type: "boisson", qty: 1, status: "ready" },
    ],
  },
  {
    id: 4, ref: "CMD-844", stand: "A-05", name: "Jean Moreau", slot: "soir", notes: "Allergie arachides",
    items: [
      { id: 401, name: "Velouté butternut", type: "entree", qty: 2, status: "pending" },
      { id: 402, name: "Suprême de volaille", type: "plat", qty: 2, status: "pending" },
      { id: 403, name: "Fondant chocolat", type: "dessert", qty: 2, status: "pending" },
    ],
  },
  {
    id: 5, ref: "CMD-843", stand: "D-14", name: "Claire Petit", slot: "midi",
    items: [
      { id: 501, name: "Tartare saumon", type: "entree", qty: 1, status: "delivered" },
      { id: 502, name: "Dos de cabillaud", type: "plat", qty: 1, status: "delivered" },
      { id: 503, name: "Crème brûlée", type: "dessert", qty: 1, status: "delivered" },
    ],
  },
];

// Group orders by dominant status for display in tabs
function getOrderStatus(order) {
  const statuses = order.items.map((i) => i.status);
  if (statuses.every((s) => s === "delivered")) return "delivered";
  if (statuses.some((s) => s === "preparing")) return "preparing";
  if (statuses.some((s) => s === "ready") && !statuses.some((s) => s === "pending" || s === "preparing")) return "ready";
  if (statuses.some((s) => s === "ready")) return "preparing"; // mixed = still in progress
  return "pending";
}

function OrderCard({ order, onAdvanceItem, onAdvanceAll }) {
  const [expanded, setExpanded] = useState(false);
  const orderStatus = getOrderStatus(order);
  const nextStatus = NEXT[orderStatus];
  const allSameStatus = order.items.every((i) => i.status === order.items[0].status);
  const pendingItems = order.items.filter((i) => NEXT[i.status]);

  return (
    <div style={{
      background: "white", borderRadius: 16, border: `1px solid ${C.border}`,
      overflow: "hidden", marginBottom: 10,
    }}>
      {/* Order header — tappable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "16px 16px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Stand badge — BIG and prominent */}
        <div style={{
          minWidth: 52, height: 52, borderRadius: 14, background: `${C.poudre}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          ...sans(15, { color: C.rose, bold: true }),
        }}>
          {order.stand}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={sans(16, { color: C.dark, bold: true })}>{order.name}</span>
            <span style={{
              ...sans(9, { upper: true, tracking: "0.06em", color: order.slot === "midi" ? C.olive : C.vr }),
              padding: "2px 7px", borderRadius: 50,
              background: order.slot === "midi" ? `${C.olive}12` : `${C.poudre}40`,
            }}>
              {order.slot === "midi" ? "☀" : "☽"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={sans(12, { color: C.muted })}>{order.ref}</span>
            <span style={sans(12, { color: C.muted })}>·</span>
            <span style={sans(12, { color: C.muted })}>{order.items.length} plats</span>
          </div>
        </div>

        {/* Expand chevron */}
        <span style={{
          fontSize: 16, color: C.muted, transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0)",
        }}>
          ▾
        </span>
      </button>

      {/* Alert notes */}
      {order.notes && (
        <div style={{
          margin: "0 16px 8px", padding: "8px 12px", borderRadius: 10,
          background: `${C.red}08`, border: `1px solid ${C.red}18`,
          ...sans(13, { color: C.red }), display: "flex", alignItems: "center", gap: 6,
        }}>
          ⚠ {order.notes}
        </div>
      )}

      {/* Items — collapsible on mobile, always visible is fine too */}
      <div style={{
        maxHeight: expanded ? 500 : 0, overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{ padding: "0 16px 12px" }}>
          {/* Items list */}
          {order.items.map((item) => {
            const next = NEXT[item.status];
            const statusColor = TABS.find((t) => t.key === item.status)?.color || C.muted;
            return (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0", borderBottom: `1px solid ${C.cream}`,
              }}>
                <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{TYPE_EMOJI[item.type]}</span>
                <div style={{ flex: 1 }}>
                  <span style={sans(14, { color: C.dark })}>{item.name}</span>
                  {item.qty > 1 && <span style={sans(13, { color: C.rose, bold: true })}> ×{item.qty}</span>}
                </div>
                {/* Per-item advance button */}
                {next ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAdvanceItem(order.id, item.id); }}
                    style={{
                      ...sans(11, { upper: true, tracking: "0.06em", color: NEXT_COLOR[item.status] }),
                      padding: "6px 12px", borderRadius: 50,
                      border: `1.5px solid ${NEXT_COLOR[item.status]}30`,
                      background: `${NEXT_COLOR[item.status]}10`,
                      cursor: "pointer", minHeight: 36,
                    }}
                  >
                    {item.status === "pending" ? "Préparer" : item.status === "preparing" ? "Prêt ✓" : "Livré ✓✓"}
                  </button>
                ) : (
                  <span style={{
                    ...sans(10, { color: C.green }), padding: "6px 12px",
                    borderRadius: 50, background: `${C.green}10`,
                  }}>✓✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk action — BIG thumb-friendly button */}
      {pendingItems.length > 0 && allSameStatus && nextStatus && (
        <button
          onClick={() => onAdvanceAll(order.id)}
          style={{
            width: "100%", padding: "14px 0",
            background: `${NEXT_COLOR[order.items[0].status]}12`,
            borderTop: `1px solid ${C.border}`,
            border: "none", cursor: "pointer",
            ...sans(13, { upper: true, tracking: "0.1em", color: NEXT_COLOR[order.items[0].status], bold: true }),
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            minHeight: 50,
          }}
        >
          {NEXT_LABEL[order.items[0].status]} · Toute la commande
        </button>
      )}
    </div>
  );
}

export default function StaffKitchenMobile() {
  const [orders, setOrders] = useState(INIT_ORDERS);
  const [activeTab, setActiveTab] = useState("pending");
  const [slotFilter, setSlotFilter] = useState("all");

  const advanceItem = useCallback((orderId, itemId) => {
    setOrders((prev) => prev.map((o) =>
      o.id === orderId
        ? { ...o, items: o.items.map((i) => i.id === itemId ? { ...i, status: NEXT[i.status] || i.status } : i) }
        : o
    ));
  }, []);

  const advanceAll = useCallback((orderId) => {
    setOrders((prev) => prev.map((o) =>
      o.id === orderId
        ? { ...o, items: o.items.map((i) => ({ ...i, status: NEXT[i.status] || i.status })) }
        : o
    ));
  }, []);

  // Filter by slot
  const filteredOrders = orders.filter((o) => slotFilter === "all" || o.slot === slotFilter);

  // Group by tab (using dominant order status)
  const tabOrders = filteredOrders.filter((o) => getOrderStatus(o) === activeTab);

  // Tab counts
  const counts = {};
  TABS.forEach((t) => {
    counts[t.key] = filteredOrders.filter((o) => getOrderStatus(o) === t.key).length;
  });

  // Global progress
  const allItems = filteredOrders.flatMap((o) => o.items);
  const totalItems = allItems.length;
  const deliveredItems = allItems.filter((i) => i.status === "delivered").length;
  const progress = totalItems > 0 ? Math.round((deliveredItems / totalItems) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, maxWidth: 520, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { background: ${C.cream}; }
        button:active { transform: scale(0.97); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ═══ STICKY HEADER ═══ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50, background: "white",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={sans(8, { upper: true, tracking: "0.25em", color: C.vr })}>Maison</div>
              <div style={serif(16, { color: C.rose })}>Félicien</div>
            </div>
            <div style={{ width: 1, height: 24, background: C.border }} />
            <span style={{
              ...sans(9, { upper: true, tracking: "0.08em", color: C.orange }),
              padding: "3px 10px", borderRadius: 50, background: `${C.orange}12`,
            }}>🍳 Cuisine</span>
          </div>

          {/* Slot filter — compact */}
          <div style={{ display: "flex", borderRadius: 50, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {[
              { key: "all", label: "Tous" },
              { key: "midi", label: "☀" },
              { key: "soir", label: "☽" },
            ].map((s) => (
              <button key={s.key} onClick={() => setSlotFilter(s.key)} style={{
                ...sans(12, { color: slotFilter === s.key ? C.cream : C.muted }),
                padding: "6px 12px", border: "none",
                background: slotFilter === s.key ? C.rose : "transparent",
                cursor: "pointer", minHeight: 32,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ padding: "0 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: `${C.border}` }}>
            <div style={{
              height: "100%", borderRadius: 2, background: C.green,
              width: `${progress}%`, transition: "width 0.5s",
            }} />
          </div>
          <span style={sans(12, { color: progress === 100 ? C.green : C.muted, bold: true })}>{progress}%</span>
        </div>

        {/* ═══ TAB BAR — the key mobile pattern ═══ */}
        <div style={{
          display: "flex", borderTop: `1px solid ${C.cream}`,
        }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: "10px 4px 12px", border: "none", cursor: "pointer",
                  background: active ? `${tab.color}08` : "transparent",
                  borderBottom: `3px solid ${active ? tab.color : "transparent"}`,
                  transition: "all 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 14 }}>{tab.icon}</span>
                  {/* Count badge */}
                  <span style={{
                    ...sans(13, { color: active ? tab.color : C.muted, bold: active }),
                    minWidth: 20, textAlign: "center",
                  }}>
                    {counts[tab.key]}
                  </span>
                </div>
                <span style={sans(9, { upper: true, tracking: "0.06em", color: active ? tab.color : C.muted })}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ═══ ORDER LIST ═══ */}
      <main style={{ padding: "12px 12px 80px" }}>
        {tabOrders.length > 0 ? (
          tabOrders.map((order, i) => (
            <div key={order.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.06}s both` }}>
              <OrderCard
                order={order}
                onAdvanceItem={advanceItem}
                onAdvanceAll={advanceAll}
              />
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>
              {activeTab === "delivered" ? "🎉" : activeTab === "ready" ? "✓" : "☕"}
            </div>
            <div style={serif(20, { color: activeTab === "delivered" ? C.green : C.muted })}>
              {activeTab === "delivered"
                ? "Tout est livré !"
                : activeTab === "ready"
                ? "Rien en attente de livraison"
                : activeTab === "preparing"
                ? "Rien en préparation"
                : "Aucune commande en attente"}
            </div>
          </div>
        )}
      </main>

      {/* ═══ BOTTOM ACTION BAR — always in thumb zone ═══ */}
      {activeTab !== "delivered" && tabOrders.length > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 520, margin: "0 auto",
          background: "white", borderTop: `1px solid ${C.border}`,
          padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 -2px 12px rgba(57,45,49,0.06)",
          zIndex: 40,
        }}>
          <div>
            <div style={sans(11, { color: C.muted })}>
              {activeTab === "pending" ? "En attente" : activeTab === "preparing" ? "En cours" : "Prêts"}
            </div>
            <div style={sans(16, { color: C.dark, bold: true })}>
              {tabOrders.length} commande{tabOrders.length > 1 ? "s" : ""}
            </div>
          </div>
          <button style={{
            ...sans(12, { upper: true, tracking: "0.1em", color: "white", bold: true }),
            padding: "14px 24px", borderRadius: 50, border: "none",
            background: TABS.find((t) => t.key === activeTab)?.color || C.rose,
            cursor: "pointer", minHeight: 48,
          }}>
            Tout avancer →
          </button>
        </div>
      )}
    </div>
  );
}
