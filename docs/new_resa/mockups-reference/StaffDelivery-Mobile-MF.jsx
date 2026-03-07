import { useState, useCallback } from "react";

/*
 * STAFF DELIVERY — Mobile-First Redesign
 * 
 * Les livreurs marchent dans les allées du salon avec un téléphone.
 * Tout doit être utilisable d'une main, debout, en mouvement.
 *
 * UX principles :
 * - Stand = info la plus visible (gros badge, c'est ce qu'ils cherchent physiquement)
 * - 2 vues simples : "À livrer" et "Fait" (pas plus)
 * - Confirmation en 1 tap (pas de modal complexe)
 * - Zone d'action toujours dans le pouce (bottom)
 * - Items résumés en pills (pas besoin de détails en livraison)
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

const TYPE_EMOJI = { entree: "🥗", plat: "🍽", dessert: "🍰", boisson: "🥤" };

const INIT = [
  {
    id: 1, stand: "A-12", name: "Sophie Martin", ref: "CMD-847", slot: "midi",
    items: [
      { name: "Velouté butternut", type: "entree", qty: 1 },
      { name: "Suprême de volaille", type: "plat", qty: 1 },
      { name: "Crème brûlée", type: "dessert", qty: 1 },
      { name: "Eau minérale", type: "boisson", qty: 1 },
    ],
    status: "ready", notes: "",
  },
  {
    id: 2, stand: "B-08", name: "Pierre Dubois", ref: "CMD-846", slot: "midi",
    items: [
      { name: "Tartare saumon", type: "entree", qty: 1 },
      { name: "Dos de cabillaud", type: "plat", qty: 1 },
      { name: "Fondant chocolat", type: "dessert", qty: 1 },
      { name: "Café", type: "boisson", qty: 2 },
    ],
    status: "ready", notes: "Allergie arachides",
  },
  {
    id: 3, stand: "C-22", name: "Marie Laurent", ref: "CMD-845", slot: "midi",
    items: [
      { name: "Salade chèvre chaud", type: "entree", qty: 1 },
      { name: "Risotto cèpes", type: "plat", qty: 1 },
      { name: "Panna cotta", type: "dessert", qty: 1 },
      { name: "Jus de fruits", type: "boisson", qty: 1 },
    ],
    status: "in_transit", notes: "",
  },
  {
    id: 4, stand: "A-05", name: "Jean Moreau", ref: "CMD-844", slot: "soir",
    items: [
      { name: "Velouté butternut", type: "entree", qty: 2 },
      { name: "Suprême de volaille", type: "plat", qty: 2 },
      { name: "Fondant chocolat", type: "dessert", qty: 2 },
    ],
    status: "delivered", deliveredAt: "12:34",
  },
  {
    id: 5, stand: "D-14", name: "Claire Petit", ref: "CMD-843", slot: "midi",
    items: [
      { name: "Tartare saumon", type: "entree", qty: 1 },
      { name: "Dos de cabillaud", type: "plat", qty: 1 },
      { name: "Crème brûlée", type: "dessert", qty: 1 },
    ],
    status: "delivered", deliveredAt: "12:18",
  },
];

function DeliveryCard({ d, onStart, onDeliver }) {
  const [confirming, setConfirming] = useState(false);
  const isReady = d.status === "ready";
  const isTransit = d.status === "in_transit";
  const isDone = d.status === "delivered";

  return (
    <div style={{
      background: "white", borderRadius: 16, border: `1px solid ${C.border}`,
      overflow: "hidden", opacity: isDone ? 0.55 : 1, transition: "all 0.3s",
    }}>
      {/* Main card body */}
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* STAND — the biggest, most visible element */}
          <div style={{
            minWidth: 64, height: 64, borderRadius: 16,
            background: isDone ? `${C.green}15` : isTransit ? `${C.orange}15` : `${C.poudre}40`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={sans(20, { color: isDone ? C.green : C.rose, bold: true })}>{d.stand}</span>
            {isTransit && <span style={{ fontSize: 10 }}>🚚</span>}
            {isDone && <span style={{ fontSize: 10 }}>✓✓</span>}
          </div>

          <div style={{ flex: 1 }}>
            {/* Client name + ref */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={sans(16, { color: C.dark, bold: true })}>{d.name}</span>
              <span style={{
                ...sans(9, { upper: true, tracking: "0.06em", color: d.slot === "midi" ? C.olive : C.vr }),
                padding: "2px 6px", borderRadius: 50,
                background: d.slot === "midi" ? `${C.olive}12` : `${C.poudre}40`,
              }}>
                {d.slot === "midi" ? "☀" : "☽"}
              </span>
            </div>
            <span style={sans(12, { color: C.muted })}>{d.ref} · {d.items.length} plats</span>

            {/* Items as compact pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {d.items.map((item, i) => (
                <span key={i} style={{
                  ...sans(12, { color: C.dark }),
                  padding: "4px 8px", borderRadius: 50, background: C.cream,
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  <span style={{ fontSize: 13 }}>{TYPE_EMOJI[item.type]}</span>
                  {item.qty > 1 ? `×${item.qty}` : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Alert */}
        {d.notes && (
          <div style={{
            marginTop: 10, padding: "8px 12px", borderRadius: 10,
            background: `${C.red}08`, border: `1px solid ${C.red}18`,
            ...sans(13, { color: C.red }), display: "flex", alignItems: "center", gap: 6,
          }}>
            ⚠ {d.notes}
          </div>
        )}

        {/* Delivered info */}
        {isDone && d.deliveredAt && (
          <div style={{ marginTop: 8, ...sans(12, { color: C.green }) }}>
            ✓✓ Livré à {d.deliveredAt}
          </div>
        )}
      </div>

      {/* ═══ ACTION BUTTONS — big, thumb-friendly ═══ */}
      {isReady && !confirming && (
        <button onClick={() => onStart(d.id)} style={{
          width: "100%", padding: "16px 0", border: "none",
          borderTop: `1px solid ${C.border}`,
          background: `${C.orange}10`, cursor: "pointer",
          ...sans(14, { upper: true, tracking: "0.08em", color: C.orange, bold: true }),
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          minHeight: 54,
        }}>
          🚚 Partir livrer
        </button>
      )}

      {isTransit && !confirming && (
        <button onClick={() => setConfirming(true)} style={{
          width: "100%", padding: "16px 0", border: "none",
          borderTop: `1px solid ${C.border}`,
          background: `${C.green}12`, cursor: "pointer",
          ...sans(14, { upper: true, tracking: "0.08em", color: C.green, bold: true }),
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          minHeight: 54,
        }}>
          ✓ Confirmer la livraison
        </button>
      )}

      {/* Confirm panel — replaces button, no modal needed */}
      {confirming && (
        <div style={{
          padding: "16px", borderTop: `1px solid ${C.border}`,
          background: `${C.green}06`,
        }}>
          <div style={{ ...sans(13, { color: C.dark }), marginBottom: 10 }}>
            Livré au stand <strong>{d.stand}</strong> ?
          </div>
          {/* Photo zone */}
          <button style={{
            width: "100%", padding: "16px", borderRadius: 12, marginBottom: 10,
            border: `2px dashed ${C.border}`, background: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            ...sans(13, { color: C.muted }), minHeight: 52,
          }}>
            📷 Photo (optionnel)
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirming(false)} style={{
              flex: 1, padding: "12px 0", borderRadius: 50,
              border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer",
              ...sans(12, { color: C.dark }), minHeight: 46,
            }}>Annuler</button>
            <button onClick={() => { onDeliver(d.id); setConfirming(false); }} style={{
              flex: 2, padding: "12px 0", borderRadius: 50,
              border: "none", background: C.green, cursor: "pointer",
              ...sans(13, { upper: true, tracking: "0.08em", color: "white", bold: true }), minHeight: 46,
            }}>✓✓ C'est livré</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffDeliveryMobile() {
  const [deliveries, setDeliveries] = useState(INIT);
  const [view, setView] = useState("active"); // active | done

  const startDelivery = useCallback((id) => {
    setDeliveries((p) => p.map((d) => d.id === id ? { ...d, status: "in_transit" } : d));
  }, []);

  const confirmDelivery = useCallback((id) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setDeliveries((p) => p.map((d) =>
      d.id === id ? { ...d, status: "delivered", deliveredAt: time } : d
    ));
  }, []);

  const active = deliveries.filter((d) => d.status !== "delivered");
  const done = deliveries.filter((d) => d.status === "delivered");
  const displayed = view === "active" ? active : done;

  const inTransit = deliveries.filter((d) => d.status === "in_transit").length;
  const ready = deliveries.filter((d) => d.status === "ready").length;

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={sans(8, { upper: true, tracking: "0.25em", color: C.vr })}>Maison</div>
              <div style={serif(16, { color: C.rose })}>Félicien</div>
            </div>
            <div style={{ width: 1, height: 24, background: C.border }} />
            <span style={{
              ...sans(9, { upper: true, tracking: "0.08em", color: C.green }),
              padding: "3px 10px", borderRadius: 50, background: `${C.green}12`,
            }}>🚚 Livraisons</span>
          </div>

          {/* Quick count badges */}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              borderRadius: 50, background: `${C.olive}10`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.olive }} />
              <span style={sans(13, { color: C.olive, bold: true })}>{ready}</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              borderRadius: 50, background: `${C.orange}10`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange }} />
              <span style={sans(13, { color: C.orange, bold: true })}>{inTransit}</span>
            </div>
          </div>
        </div>

        {/* View toggle — 2 tabs only */}
        <div style={{ display: "flex" }}>
          {[
            { key: "active", label: `À livrer (${active.length})` },
            { key: "done", label: `Fait (${done.length})` },
          ].map((v) => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              flex: 1, padding: "10px 0", border: "none",
              borderBottom: `3px solid ${view === v.key ? (v.key === "active" ? C.orange : C.green) : "transparent"}`,
              background: "transparent", cursor: "pointer",
              ...sans(13, { color: view === v.key ? C.dark : C.muted, bold: view === v.key }),
              minHeight: 42,
            }}>
              {v.label}
            </button>
          ))}
        </div>
      </header>

      {/* ═══ ROUTE SUGGESTION ═══ */}
      {view === "active" && active.length > 1 && (
        <div style={{
          margin: "12px 12px 0", padding: "12px 14px", borderRadius: 14,
          background: `${C.olive}08`, border: `1px solid ${C.olive}20`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🗺</span>
          <div style={{ flex: 1 }}>
            <div style={sans(11, { color: C.dark, bold: true })}>Itinéraire</div>
            <div style={sans(13, { color: C.olive, bold: true })}>
              {active.map((d) => d.stand).join("  →  ")}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELIVERY CARDS ═══ */}
      <main style={{ padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        {displayed.length > 0 ? (
          displayed.map((d, i) => (
            <div key={d.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.06}s both` }}>
              <DeliveryCard d={d} onStart={startDelivery} onDeliver={confirmDelivery} />
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>
              {view === "active" ? "🎉" : "📋"}
            </div>
            <div style={serif(20, { color: view === "active" ? C.green : C.muted })}>
              {view === "active" ? "Tout est livré !" : "Aucune livraison encore"}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
