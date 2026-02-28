import { useState, useEffect } from "react";

const C = {
  rose: "#8B3A43", vr: "#BF646D", poudre: "#E5B7B3", olive: "#968A42",
  cream: "#F0F0E6", dark: "#392D31", white: "#FDFAF7", border: "#E5D9D0",
  muted: "#9A8A7C", green: "#4A7C59", orange: "#C4793A", red: "#A63D40",
};

const sans = (sz, opts = {}) => ({
  fontFamily: "'Questrial', sans-serif", fontSize: sz,
  fontWeight: opts.bold ? 600 : 400, color: opts.color || C.dark,
  letterSpacing: opts.tracking || 0, textTransform: opts.upper ? "uppercase" : "none",
  lineHeight: opts.lh || 1.5,
});

const serif = (sz, opts = {}) => ({
  fontFamily: "'Georgia', serif", fontSize: sz, fontWeight: 400,
  fontStyle: opts.italic !== false ? "italic" : "normal", color: opts.color || C.rose,
});

const STATS = [
  { label: "Commandes", value: "47", sub: "+12 aujourd'hui", icon: "📋", trend: "+34%", up: true },
  { label: "Chiffre d'affaires", value: "2 840 €", sub: "Salon du Bâtiment", icon: "💰", trend: "+18%", up: true },
  { label: "Repas à préparer", value: "23", sub: "Midi aujourd'hui", icon: "🍽", trend: "", up: false },
  { label: "Taux livraison", value: "96%", sub: "Sur 5 jours", icon: "✓", trend: "+2%", up: true },
];

const ORDERS = [
  { id: "CMD-001847", name: "Sophie Martin", stand: "A-12", items: 4, total: "62.50", status: "paid", time: "Il y a 12 min" },
  { id: "CMD-001846", name: "Pierre Dubois", stand: "B-08", items: 3, total: "48.00", status: "paid", time: "Il y a 25 min" },
  { id: "CMD-001845", name: "Marie Laurent", stand: "C-22", items: 5, total: "71.50", status: "pending", time: "Il y a 38 min" },
  { id: "CMD-001844", name: "Jean Moreau", stand: "A-05", items: 2, total: "33.00", status: "paid", time: "Il y a 1h" },
  { id: "CMD-001843", name: "Claire Petit", stand: "D-14", items: 4, total: "58.00", status: "cancelled", time: "Il y a 1h30" },
];

const PREP_PIPELINE = [
  { status: "En attente", count: 8, color: C.muted },
  { status: "En préparation", count: 12, color: C.orange },
  { status: "Prêts", count: 6, color: C.olive },
  { status: "Livrés", count: 21, color: C.green },
];

const STATUS_COLORS = {
  paid: { bg: `${C.green}18`, text: C.green, label: "Payée" },
  pending: { bg: `${C.orange}18`, text: C.orange, label: "En attente" },
  cancelled: { bg: `${C.red}18`, text: C.red, label: "Annulée" },
};

const REVENUE_DAYS = [
  { day: "Lun", value: 480, midi: 320, soir: 160 },
  { day: "Mar", value: 620, midi: 380, soir: 240 },
  { day: "Mer", value: 750, midi: 450, soir: 300 },
  { day: "Jeu", value: 580, midi: 340, soir: 240 },
  { day: "Ven", value: 410, midi: 280, soir: 130 },
];
const MAX_REV = Math.max(...REVENUE_DAYS.map((d) => d.value));

function Sidebar({ active, onNav }) {
  const items = [
    { key: "dashboard", icon: "◈", label: "Tableau de bord" },
    { key: "events", icon: "◷", label: "Événements" },
    { key: "menu", icon: "❋", label: "La Carte" },
    { key: "orders", icon: "📋", label: "Commandes" },
    { key: "kitchen", icon: "🍳", label: "Cuisine" },
    { key: "delivery", icon: "🚚", label: "Livraisons" },
  ];
  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "white", borderRight: `1px solid ${C.border}`,
      padding: "24px 0", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, zIndex: 40,
    }}>
      <div style={{ textAlign: "center", marginBottom: 32, padding: "0 20px" }}>
        <div style={sans(9, { upper: true, tracking: "0.3em", color: C.vr })}>Maison</div>
        <div style={serif(22, { color: C.rose })}>Félicien</div>
        <div style={{ ...sans(9, { upper: true, tracking: "0.1em", color: C.muted }), marginTop: 4, padding: "3px 10px", borderRadius: 50, background: `${C.rose}12`, display: "inline-block" }}>
          Admin
        </div>
      </div>
      <nav style={{ flex: 1 }}>
        {items.map((it) => (
          <button key={it.key} onClick={() => onNav?.(it.key)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 24px",
            background: active === it.key ? `${C.poudre}30` : "transparent",
            border: "none", borderRight: active === it.key ? `2.5px solid ${C.rose}` : "2.5px solid transparent",
            cursor: "pointer", transition: "all 0.2s",
            ...sans(13, { color: active === it.key ? C.rose : C.muted }),
          }}>
            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{it.icon}</span>
            {it.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={sans(12, { color: C.dark, bold: true })}>Félicien Admin</div>
        <div style={sans(11, { color: C.muted })}>admin@maisonfelicien.fr</div>
      </div>
    </aside>
  );
}

function StatCard({ stat, delay }) {
  return (
    <div style={{
      background: "white", borderRadius: 18, border: `1px solid ${C.border}`,
      padding: "20px 18px", transition: "box-shadow 0.3s", cursor: "default",
      animation: `fadeUp 0.6s ease ${delay}s both`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, background: `${C.poudre}30`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          {stat.icon}
        </div>
        {stat.trend && (
          <span style={{
            ...sans(10, { color: stat.up ? C.green : C.red, bold: true }),
            padding: "2px 8px", borderRadius: 50,
            background: stat.up ? `${C.green}12` : `${C.red}12`,
          }}>
            {stat.trend}
          </span>
        )}
      </div>
      <div style={serif(26, { color: C.dark, italic: false })}>{stat.value}</div>
      <div style={sans(11, { color: C.muted, style: { marginTop: 2 } })}>{stat.label}</div>
      <div style={sans(10, { color: C.vr, style: { marginTop: 1 } })}>{stat.sub}</div>
    </div>
  );
}

function MiniChart({ data, max }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 1, height: 80, justifyContent: "flex-end" }}>
            <div style={{
              height: `${(d.soir / max) * 100}%`, background: C.poudre, borderRadius: "4px 4px 0 0",
              transition: "height 0.6s ease", minHeight: d.soir > 0 ? 4 : 0,
            }} />
            <div style={{
              height: `${(d.midi / max) * 100}%`, background: C.rose, borderRadius: "0 0 4px 4px",
              transition: "height 0.6s ease", minHeight: 4,
            }} />
          </div>
          <span style={sans(10, { color: C.muted })}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [nav, setNav] = useState("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { background: ${C.cream}; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        button:active { transform: scale(0.98); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.poudre}; border-radius: 4px; }
      `}</style>

      <Sidebar active={nav} onNav={setNav} />

      <main style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ ...serif(30, { color: C.rose }), margin: "0 0 4px" }}>Tableau de bord</h1>
            <p style={sans(13, { color: C.muted })}>Salon du Bâtiment · Mercredi 18 mars 2026</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{
              ...sans(12, { color: C.dark }), padding: "9px 16px", borderRadius: 50,
              border: `1px solid ${C.border}`, background: "white", cursor: "pointer", outline: "none",
            }}>
              <option>Salon du Bâtiment 2026</option>
              <option>Foire de Lyon 2026</option>
            </select>
            <button style={{
              ...sans(11, { upper: true, tracking: "0.1em", color: C.cream }),
              padding: "9px 20px", borderRadius: 50, background: C.rose, border: "none", cursor: "pointer",
            }}>
              + Nouvel événement
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {STATS.map((s, i) => <StatCard key={i} stat={s} delay={i * 0.1} />)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
          {/* Orders table */}
          <div style={{ background: "white", borderRadius: 18, border: `1px solid ${C.border}`, padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={serif(20, { color: C.rose })}>Dernières commandes</h2>
              <button style={{ ...sans(10, { upper: true, tracking: "0.1em", color: C.rose }), background: "none", border: "none", cursor: "pointer" }}>
                Voir tout →
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "100px 1fr 60px 80px 80px 90px",
                gap: 8, padding: "8px 12px", borderBottom: `1px solid ${C.border}`,
              }}>
                {["N°", "Client", "Stand", "Articles", "Total", "Statut"].map((h) => (
                  <span key={h} style={sans(9, { upper: true, tracking: "0.1em", color: C.muted })}>{h}</span>
                ))}
              </div>
              {ORDERS.map((o) => {
                const st = STATUS_COLORS[o.status];
                return (
                  <div key={o.id} style={{
                    display: "grid", gridTemplateColumns: "100px 1fr 60px 80px 80px 90px",
                    gap: 8, padding: "12px 12px", borderBottom: `1px solid ${C.cream}`,
                    cursor: "pointer", transition: "background 0.2s", borderRadius: 8,
                  }}>
                    <span style={sans(12, { color: C.rose, bold: true })}>{o.id}</span>
                    <div>
                      <div style={sans(13, { color: C.dark })}>{o.name}</div>
                      <div style={sans(10, { color: C.muted })}>{o.time}</div>
                    </div>
                    <span style={sans(12, { color: C.dark })}>{o.stand}</span>
                    <span style={sans(12, { color: C.dark })}>{o.items} plats</span>
                    <span style={sans(13, { color: C.dark, bold: true })}>{o.total} €</span>
                    <span style={{
                      ...sans(10, { upper: true, tracking: "0.06em", color: st.text }),
                      padding: "4px 10px", borderRadius: 50, background: st.bg,
                      textAlign: "center", alignSelf: "center",
                    }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Revenue chart */}
            <div style={{ background: "white", borderRadius: 18, border: `1px solid ${C.border}`, padding: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={serif(18, { color: C.rose })}>Revenus</h3>
                <span style={sans(12, { color: C.muted })}>Cette semaine</span>
              </div>
              <div style={{ ...serif(28, { color: C.dark, italic: false }), marginBottom: 4 }}>2 840 €</div>
              <div style={{ ...sans(11, { color: C.green }), marginBottom: 16 }}>+18% vs semaine dernière</div>
              <MiniChart data={REVENUE_DAYS} max={MAX_REV} />
              <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: C.rose }} />
                  <span style={sans(10, { color: C.muted })}>Midi</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: C.poudre }} />
                  <span style={sans(10, { color: C.muted })}>Soir</span>
                </div>
              </div>
            </div>

            {/* Prep pipeline */}
            <div style={{ background: "white", borderRadius: 18, border: `1px solid ${C.border}`, padding: "22px" }}>
              <h3 style={{ ...serif(18, { color: C.rose }), marginBottom: 14 }}>Pipeline cuisine</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PREP_PIPELINE.map((p) => (
                  <div key={p.status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={sans(12, { color: C.dark })}>{p.status}</span>
                      <span style={sans(12, { color: p.color, bold: true })}>{p.count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: C.cream }}>
                      <div style={{
                        height: "100%", borderRadius: 3, background: p.color,
                        width: `${(p.count / 47) * 100}%`, transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: "white", borderRadius: 18, border: `1px solid ${C.border}`, padding: "22px" }}>
              <h3 style={{ ...serif(18, { color: C.rose }), marginBottom: 14 }}>Actions rapides</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Exporter les commandes", icon: "↓" },
                  { label: "Modifier le menu", icon: "✎" },
                  { label: "Envoyer un rappel", icon: "✉" },
                ].map((a) => (
                  <button key={a.label} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 14px", borderRadius: 12,
                    border: `1px solid ${C.border}`, background: "white", cursor: "pointer",
                    ...sans(12, { color: C.dark }), transition: "all 0.2s",
                  }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: `${C.poudre}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.rose }}>{a.icon}</span>
                    {a.label}
                    <span style={{ marginLeft: "auto", color: C.muted, fontSize: 12 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
