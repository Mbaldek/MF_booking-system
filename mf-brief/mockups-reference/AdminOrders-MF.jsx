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

const STATUS = {
  paid: { label: "Payée", color: C.green, bg: `${C.green}12` },
  pending: { label: "En attente", color: C.orange, bg: `${C.orange}12` },
  cancelled: { label: "Annulée", color: C.red, bg: `${C.red}12` },
  refunded: { label: "Remboursée", color: C.muted, bg: `${C.muted}12` },
};

const ORDERS = [
  { id: "CMD-001847", name: "Sophie Martin", email: "sophie.martin@abc.com", stand: "A-12", slot: "midi", date: "18/03", items: 4, total: 62.5, status: "paid", time: "12:04", delivery: "livraison", company: "ABC Corp", prepProgress: 75 },
  { id: "CMD-001846", name: "Pierre Dubois", email: "p.dubois@xyz.fr", stand: "B-08", slot: "midi", date: "18/03", items: 5, total: 48.0, status: "paid", time: "11:42", delivery: "livraison", company: "XYZ Sarl", prepProgress: 50 },
  { id: "CMD-001845", name: "Marie Laurent", email: "marie@startup.io", stand: "C-22", slot: "midi", date: "18/03", items: 4, total: 71.5, status: "pending", time: "11:28", delivery: "livraison", company: "Startup.io", prepProgress: 0 },
  { id: "CMD-001844", name: "Jean Moreau", email: "jm@tech.com", stand: "A-05", slot: "soir", date: "18/03", items: 6, total: 99.0, status: "paid", time: "10:55", delivery: "livraison", company: "TechFr", prepProgress: 100 },
  { id: "CMD-001843", name: "Claire Petit", email: "claire@design.fr", stand: "D-14", slot: "midi", date: "18/03", items: 3, total: 58.0, status: "cancelled", time: "10:30", delivery: "livraison", company: "Design Studio", prepProgress: 0 },
  { id: "CMD-001842", name: "Lucas Bernard", email: "lucas@build.fr", stand: "E-03", slot: "midi", date: "17/03", items: 4, total: 55.5, status: "paid", time: "12:15", delivery: "à emporter", company: "BuildCo", prepProgress: 100 },
  { id: "CMD-001841", name: "Emma Roux", email: "emma.r@archi.com", stand: "A-18", slot: "soir", date: "17/03", items: 3, total: 42.0, status: "paid", time: "11:50", delivery: "livraison", company: "Archi+", prepProgress: 100 },
  { id: "CMD-001840", name: "Thomas Garnier", email: "t.garnier@immo.fr", stand: "B-22", slot: "midi", date: "17/03", items: 5, total: 76.0, status: "refunded", time: "11:10", delivery: "livraison", company: "ImmoGroup", prepProgress: 0 },
];

function OrderDetail({ order, onClose }) {
  const st = STATUS[order.status];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(57,45,49,0.3)" }} />
      <div style={{
        position: "relative", background: "white", borderRadius: 22, padding: "30px 28px",
        width: 500, maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(57,45,49,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ ...serif(24, { color: C.rose }), margin: "0 0 4px" }}>{order.id}</h2>
            <span style={{
              ...sans(10, { upper: true, tracking: "0.08em", color: st.color }),
              padding: "3px 10px", borderRadius: 50, background: st.bg,
            }}>{st.label}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: C.muted, cursor: "pointer" }}>✕</button>
        </div>

        {/* Client info */}
        <div style={{ padding: "16px", borderRadius: 14, background: C.cream, marginBottom: 16 }}>
          <div style={{ ...sans(10, { upper: true, tracking: "0.1em", color: C.vr }), marginBottom: 6 }}>Client</div>
          <div style={sans(16, { color: C.dark, bold: true })}>{order.name}</div>
          <div style={sans(13, { color: C.muted })}>{order.company}</div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div>
              <span style={sans(10, { color: C.muted })}>Stand </span>
              <span style={sans(12, { color: C.dark, bold: true })}>{order.stand}</span>
            </div>
            <div>
              <span style={sans(10, { color: C.muted })}>Email </span>
              <span style={sans(12, { color: C.dark })}>{order.email}</span>
            </div>
          </div>
        </div>

        {/* Order info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Date", value: order.date },
            { label: "Service", value: order.slot === "midi" ? "☀ Midi" : "☽ Soir" },
            { label: "Mode", value: order.delivery === "livraison" ? "🚚 Livraison" : "📦 Emporter" },
          ].map((d) => (
            <div key={d.label} style={{ padding: "10px 12px", borderRadius: 10, background: C.cream, textAlign: "center" }}>
              <div style={sans(9, { upper: true, tracking: "0.08em", color: C.muted })}>{d.label}</div>
              <div style={sans(13, { color: C.dark, bold: true })}>{d.value}</div>
            </div>
          ))}
        </div>

        {/* Prep progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={sans(11, { color: C.dark })}>Préparation</span>
            <span style={sans(11, { color: order.prepProgress === 100 ? C.green : C.orange, bold: true })}>{order.prepProgress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.cream }}>
            <div style={{ height: "100%", borderRadius: 3, background: order.prepProgress === 100 ? C.green : C.orange, width: `${order.prepProgress}%`, transition: "width 0.5s" }} />
          </div>
        </div>

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0", borderTop: `2px solid ${C.rose}` }}>
          <span style={sans(12, { upper: true, tracking: "0.1em", color: C.rose })}>{order.items} articles · Total</span>
          <span style={serif(28, { color: C.dark })}>{order.total.toFixed(2)} €</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {order.status === "paid" && (
            <button style={{
              flex: 1, ...sans(11, { upper: true, tracking: "0.08em", color: C.red }),
              padding: "10px 0", borderRadius: 50, border: `1.5px solid ${C.red}30`, background: "white", cursor: "pointer",
            }}>Rembourser</button>
          )}
          <button style={{
            flex: 2, ...sans(11, { upper: true, tracking: "0.08em", color: C.cream }),
            padding: "10px 0", borderRadius: 50, border: "none", background: C.rose, cursor: "pointer", fontWeight: 500,
          }}>📧 Envoyer le reçu</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [slotFilter, setSlotFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState("time");

  const filtered = ORDERS
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) => slotFilter === "all" || o.slot === slotFilter)
    .filter((o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.stand.toLowerCase().includes(search.toLowerCase())
    );

  const totalRevenue = filtered.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0);
  const statusCounts = {
    all: ORDERS.length,
    paid: ORDERS.filter((o) => o.status === "paid").length,
    pending: ORDERS.filter((o) => o.status === "pending").length,
    cancelled: ORDERS.filter((o) => o.status === "cancelled").length,
    refunded: ORDERS.filter((o) => o.status === "refunded").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, padding: "28px 32px", marginLeft: 220 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: ${C.muted}; }
        button:active { transform: scale(0.97); }
        tr:hover td { background: ${C.cream}; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ ...serif(30, { color: C.rose }), margin: "0 0 4px" }}>Commandes</h1>
          <p style={sans(13, { color: C.muted })}>
            {filtered.length} commande{filtered.length > 1 ? "s" : ""} · {totalRevenue.toFixed(2)} € de CA
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            ...sans(11, { upper: true, tracking: "0.1em", color: C.dark }),
            padding: "9px 18px", borderRadius: 50, border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer",
          }}>↓ Exporter CSV</button>
          <button style={{
            ...sans(11, { upper: true, tracking: "0.1em", color: C.cream }),
            padding: "9px 18px", borderRadius: 50, background: C.rose, border: "none", cursor: "pointer",
          }}>+ Commande manuelle</button>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <input placeholder="Rechercher par nom, n° ou stand..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ ...sans(13), padding: "9px 16px", borderRadius: 50, border: `1px solid ${C.border}`, background: "white", outline: "none", width: 280 }} />

        {/* Status filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { key: "all", label: "Toutes" },
            { key: "paid", label: "Payées" },
            { key: "pending", label: "En attente" },
            { key: "cancelled", label: "Annulées" },
          ].map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{
              ...sans(11, { color: statusFilter === f.key ? C.cream : C.dark }),
              padding: "7px 14px", borderRadius: 50,
              background: statusFilter === f.key ? C.rose : "white",
              border: `1px solid ${statusFilter === f.key ? C.rose : C.border}`,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {f.label}
              <span style={{
                ...sans(10, { color: statusFilter === f.key ? C.poudre : C.muted }),
                padding: "0 5px", borderRadius: 50,
              }}>{statusCounts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* Slot filter */}
        <div style={{ display: "inline-flex", borderRadius: 50, border: `1px solid ${C.border}`, overflow: "hidden", marginLeft: "auto" }}>
          {[{ key: "all", label: "Tous" }, { key: "midi", label: "☀" }, { key: "soir", label: "☽" }].map((s) => (
            <button key={s.key} onClick={() => setSlotFilter(s.key)} style={{
              ...sans(12, { color: slotFilter === s.key ? C.cream : C.muted }),
              padding: "7px 14px", border: "none",
              background: slotFilter === s.key ? C.rose : "transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["N° Commande", "Client", "Stand", "Service", "Articles", "Total", "Statut", "Préparation"].map((h) => (
                <th key={h} style={{
                  ...sans(9, { upper: true, tracking: "0.1em", color: C.muted }),
                  padding: "12px 14px", textAlign: "left", fontWeight: 400,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const st = STATUS[o.status];
              return (
                <tr key={o.id} onClick={() => setSelected(o)}
                  style={{ cursor: "pointer", borderBottom: `1px solid ${C.cream}`, transition: "background 0.15s" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={sans(13, { color: C.rose, bold: true })}>{o.id}</span>
                    <div style={sans(10, { color: C.muted })}>{o.date} · {o.time}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={sans(13, { color: C.dark })}>{o.name}</div>
                    <div style={sans(10, { color: C.muted })}>{o.company}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      ...sans(12, { color: C.rose, bold: true }),
                      padding: "3px 10px", borderRadius: 8, background: `${C.poudre}25`,
                    }}>{o.stand}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={sans(12, { color: o.slot === "midi" ? C.olive : C.vr })}>
                      {o.slot === "midi" ? "☀ Midi" : "☽ Soir"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", ...sans(13, { color: C.dark }) }}>{o.items}</td>
                  <td style={{ padding: "12px 14px", ...sans(14, { color: C.dark, bold: true }) }}>{o.total.toFixed(2)} €</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      ...sans(10, { upper: true, tracking: "0.06em", color: st.color }),
                      padding: "4px 10px", borderRadius: 50, background: st.bg,
                    }}>{st.label}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 50, height: 5, borderRadius: 3, background: C.cream }}>
                        <div style={{
                          height: "100%", borderRadius: 3, width: `${o.prepProgress}%`,
                          background: o.prepProgress === 100 ? C.green : o.prepProgress > 0 ? C.orange : C.muted,
                        }} />
                      </div>
                      <span style={sans(10, { color: o.prepProgress === 100 ? C.green : C.muted })}>{o.prepProgress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>📋</div>
            <div style={sans(14, { color: C.muted })}>Aucune commande trouvée</div>
          </div>
        )}
      </div>

      {selected && <OrderDetail order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
