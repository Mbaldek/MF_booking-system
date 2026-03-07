import { useState, useCallback } from "react";

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

const DELIVERIES = [
  {
    id: 1, stand: "A-12", name: "Sophie Martin", order: "CMD-001847", slot: "midi",
    items: [
      { name: "Velouté de butternut", type: "entree" },
      { name: "Suprême de volaille", type: "plat" },
      { name: "Crème brûlée vanille", type: "dessert" },
      { name: "Eau minérale", type: "boisson" },
    ],
    status: "ready", notes: "Allergie arachides",
  },
  {
    id: 2, stand: "B-08", name: "Pierre Dubois", order: "CMD-001846", slot: "midi",
    items: [
      { name: "Tartare de saumon", type: "entree" },
      { name: "Dos de cabillaud", type: "plat" },
      { name: "Fondant au chocolat", type: "dessert" },
      { name: "Café", type: "boisson" },
      { name: "Café", type: "boisson" },
    ],
    status: "ready", notes: "",
  },
  {
    id: 3, stand: "C-22", name: "Marie Laurent", order: "CMD-001845", slot: "midi",
    items: [
      { name: "Salade de chèvre chaud", type: "entree" },
      { name: "Risotto aux cèpes", type: "plat" },
      { name: "Panna cotta framboise", type: "dessert" },
      { name: "Jus de fruits frais", type: "boisson" },
    ],
    status: "in_transit", notes: "",
  },
  {
    id: 4, stand: "A-05", name: "Jean Moreau", order: "CMD-001844", slot: "midi",
    items: [
      { name: "Velouté de butternut ×2", type: "entree" },
      { name: "Suprême de volaille ×2", type: "plat" },
      { name: "Fondant au chocolat ×2", type: "dessert" },
    ],
    status: "delivered", deliveredAt: "12:34", photo: true, notes: "2 couverts",
  },
  {
    id: 5, stand: "D-14", name: "Claire Petit", order: "CMD-001843", slot: "midi",
    items: [
      { name: "Tartare de saumon", type: "entree" },
      { name: "Dos de cabillaud", type: "plat" },
      { name: "Crème brûlée vanille", type: "dessert" },
    ],
    status: "delivered", deliveredAt: "12:18", photo: true, notes: "",
  },
];

const STATUS_MAP = {
  ready: { label: "Prêt à livrer", color: C.olive, icon: "✓", bg: `${C.olive}12` },
  in_transit: { label: "En livraison", color: C.orange, icon: "→", bg: `${C.orange}12` },
  delivered: { label: "Livré", color: C.green, icon: "✓✓", bg: `${C.green}12` },
};

const TYPE_ICONS = { entree: "🥗", plat: "🍽", dessert: "🍰", boisson: "🥤" };

function DeliveryCard({ delivery, onStartDelivery, onConfirmDelivery }) {
  const st = STATUS_MAP[delivery.status];
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div style={{
      background: "white", borderRadius: 18, border: `1px solid ${C.border}`,
      overflow: "hidden", transition: "all 0.3s",
      opacity: delivery.status === "delivered" ? 0.65 : 1,
    }}>
      {/* Card header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 18px", borderBottom: `1px solid ${C.cream}`,
        background: delivery.status === "in_transit" ? `${C.orange}06` : "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Stand badge - prominent */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: `${C.poudre}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            ...sans(14, { color: C.rose, bold: true }),
          }}>
            {delivery.stand}
          </div>
          <div>
            <div style={sans(15, { color: C.dark, bold: true })}>{delivery.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={sans(11, { color: C.muted })}>{delivery.order}</span>
              <span style={{
                ...sans(9, { upper: true, tracking: "0.06em", color: delivery.slot === "midi" ? C.olive : C.vr }),
                padding: "1px 6px", borderRadius: 50,
                background: delivery.slot === "midi" ? `${C.olive}12` : `${C.poudre}40`,
              }}>
                {delivery.slot === "midi" ? "☀" : "☽"} {delivery.slot}
              </span>
            </div>
          </div>
        </div>
        <div style={{
          ...sans(10, { upper: true, tracking: "0.08em", color: st.color, bold: true }),
          padding: "5px 12px", borderRadius: 50, background: st.bg,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span>{st.icon}</span> {st.label}
        </div>
      </div>

      {/* Items list */}
      <div style={{ padding: "12px 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {delivery.items.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 50,
              background: C.cream, ...sans(12, { color: C.dark }),
            }}>
              <span style={{ fontSize: 13 }}>{TYPE_ICONS[item.type]}</span>
              {item.name}
            </div>
          ))}
        </div>

        {delivery.notes && (
          <div style={{
            marginTop: 10, padding: "8px 12px", borderRadius: 10,
            background: `${C.red}08`, border: `1px solid ${C.red}15`,
            ...sans(12, { color: C.red }),
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>⚠</span> {delivery.notes}
          </div>
        )}

        {/* Delivered info */}
        {delivery.status === "delivered" && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={sans(11, { color: C.green })}>✓ Livré à {delivery.deliveredAt}</span>
            {delivery.photo && (
              <span style={{
                ...sans(9, { upper: true, tracking: "0.06em", color: C.olive }),
                padding: "2px 8px", borderRadius: 50, background: `${C.olive}12`,
              }}>
                📷 Photo
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {delivery.status !== "delivered" && (
        <div style={{ padding: "0 18px 16px" }}>
          {delivery.status === "ready" && !showConfirm && (
            <button onClick={() => onStartDelivery(delivery.id)} style={{
              width: "100%", padding: "12px 0", borderRadius: 50,
              border: "none", background: C.orange, cursor: "pointer",
              ...sans(12, { upper: true, tracking: "0.1em", color: "white", bold: true }),
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              🚚 Partir en livraison
            </button>
          )}
          {delivery.status === "in_transit" && !showConfirm && (
            <button onClick={() => setShowConfirm(true)} style={{
              width: "100%", padding: "12px 0", borderRadius: 50,
              border: "none", background: C.green, cursor: "pointer",
              ...sans(12, { upper: true, tracking: "0.1em", color: "white", bold: true }),
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              ✓ Confirmer la livraison
            </button>
          )}
          {showConfirm && (
            <div style={{
              padding: "16px", borderRadius: 14, background: `${C.green}08`,
              border: `1px solid ${C.green}20`,
            }}>
              <div style={{ ...sans(12, { color: C.dark, bold: true }), marginBottom: 10 }}>
                Confirmer la livraison au stand {delivery.stand} ?
              </div>
              {/* Photo capture simulation */}
              <button style={{
                width: "100%", padding: "20px", borderRadius: 12, marginBottom: 10,
                border: `2px dashed ${C.border}`, background: "white", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                ...sans(12, { color: C.muted }),
              }}>
                <span style={{ fontSize: 24 }}>📷</span>
                Prendre une photo (optionnel)
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowConfirm(false)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 50,
                  border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer",
                  ...sans(11, { upper: true, tracking: "0.08em", color: C.dark }),
                }}>Annuler</button>
                <button onClick={() => { onConfirmDelivery(delivery.id); setShowConfirm(false); }} style={{
                  flex: 2, padding: "10px 0", borderRadius: 50,
                  border: "none", background: C.green, cursor: "pointer",
                  ...sans(11, { upper: true, tracking: "0.08em", color: "white", bold: true }),
                }}>✓ Livré</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeliveryView() {
  const [deliveries, setDeliveries] = useState(DELIVERIES);
  const [filter, setFilter] = useState("active"); // active | all

  const startDelivery = useCallback((id) => {
    setDeliveries((prev) => prev.map((d) => d.id === id ? { ...d, status: "in_transit" } : d));
  }, []);

  const confirmDelivery = useCallback((id) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setDeliveries((prev) => prev.map((d) =>
      d.id === id ? { ...d, status: "delivered", deliveredAt: time, photo: false } : d
    ));
  }, []);

  const displayed = filter === "active"
    ? deliveries.filter((d) => d.status !== "delivered")
    : deliveries;

  const stats = {
    total: deliveries.length,
    ready: deliveries.filter((d) => d.status === "ready").length,
    transit: deliveries.filter((d) => d.status === "in_transit").length,
    done: deliveries.filter((d) => d.status === "delivered").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* Top bar */}
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
            ...sans(10, { upper: true, tracking: "0.1em", color: C.green }),
            padding: "4px 12px", borderRadius: 50, background: `${C.green}12`,
          }}>
            🚚 Livraisons
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Quick stats */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "À livrer", value: stats.ready, color: C.olive },
              { label: "En cours", value: stats.transit, color: C.orange },
              { label: "Livrés", value: stats.done, color: C.green },
            ].map((s) => (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                borderRadius: 50, background: `${s.color}10`,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: s.color,
                }} />
                <span style={sans(11, { color: s.color, bold: true })}>{s.value}</span>
                <span style={sans(10, { color: C.muted })}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div style={{ padding: "16px 24px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[
            { key: "active", label: `À traiter (${stats.ready + stats.transit})` },
            { key: "all", label: `Toutes (${stats.total})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              ...sans(12, { color: filter === f.key ? C.cream : C.dark }),
              padding: "8px 18px", borderRadius: 50,
              background: filter === f.key ? C.rose : "white",
              border: `1.5px solid ${filter === f.key ? C.rose : C.border}`,
              cursor: "pointer", transition: "all 0.25s",
            }}>{f.label}</button>
          ))}
        </div>

        {/* Route suggestion */}
        {stats.ready > 0 && filter === "active" && (
          <div style={{
            padding: "14px 18px", borderRadius: 14, background: `${C.olive}08`,
            border: `1px solid ${C.olive}20`, marginBottom: 16,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>🗺</span>
            <div style={{ flex: 1 }}>
              <div style={sans(13, { color: C.dark, bold: true })}>Itinéraire suggéré</div>
              <div style={sans(12, { color: C.muted })}>
                {deliveries
                  .filter((d) => d.status === "ready")
                  .map((d) => d.stand)
                  .join(" → ")}
              </div>
            </div>
            <button style={{
              ...sans(10, { upper: true, tracking: "0.06em", color: C.olive }),
              padding: "6px 14px", borderRadius: 50, background: `${C.olive}15`,
              border: "none", cursor: "pointer",
            }}>Tout livrer →</button>
          </div>
        )}

        {/* Delivery cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 32 }}>
          {displayed.map((d, i) => (
            <div key={d.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
              <DeliveryCard
                delivery={d}
                onStartDelivery={startDelivery}
                onConfirmDelivery={confirmDelivery}
              />
            </div>
          ))}
          {displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>✓✓</div>
              <div style={serif(22, { color: C.green })}>Toutes les livraisons sont faites !</div>
              <div style={sans(13, { color: C.muted, style: { marginTop: 6 } })}>Bon travail, l'équipe 🎉</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
