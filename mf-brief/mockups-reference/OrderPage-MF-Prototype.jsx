import { useState, useCallback } from "react";

const C = {
  rose: "#8B3A43",
  vr: "#BF646D",
  poudre: "#E5B7B3",
  olive: "#968A42",
  cream: "#F0F0E6",
  dark: "#392D31",
  white: "#FDFAF7",
  border: "#E5D9D0",
  muted: "#9A8A7C",
  mutedLight: "#C4B5A8",
};

const EVENT = { name: "Salon du Bâtiment 2026", loc: "Paris Expo — Porte de Versailles" };
const DAYS = [
  { key: "2026-03-16", name: "Lundi", date: "16 mars" },
  { key: "2026-03-17", name: "Mardi", date: "17 mars" },
  { key: "2026-03-18", name: "Mercredi", date: "18 mars" },
  { key: "2026-03-19", name: "Jeudi", date: "19 mars" },
  { key: "2026-03-20", name: "Vendredi", date: "20 mars" },
];

const MENU = {
  entree: [
    { id: 1, name: "Velouté de butternut", desc: "Noisettes torréfiées, crème d'estragon", price: 8.5, tags: ["Végétarien"] },
    { id: 2, name: "Tartare de saumon", desc: "Agrumes, avocat, sésame noir", price: 10, tags: ["Sans gluten"] },
    { id: 3, name: "Salade de chèvre chaud", desc: "Miel de lavande, noix de pécan", price: 9, tags: ["Végétarien"] },
  ],
  plat: [
    { id: 4, name: "Suprême de volaille", desc: "Jus corsé, purée truffée, légumes glacés", price: 16, tags: [] },
    { id: 5, name: "Dos de cabillaud", desc: "Beurre blanc, risotto au safran", price: 18, tags: ["Sans gluten"] },
    { id: 6, name: "Risotto aux cèpes", desc: "Parmesan 24 mois, roquette", price: 15, tags: ["Végétarien"] },
  ],
  dessert: [
    { id: 7, name: "Crème brûlée vanille", desc: "Gousse de Madagascar", price: 7, tags: ["Sans gluten"] },
    { id: 8, name: "Fondant au chocolat", desc: "Cœur coulant, glace vanille", price: 8, tags: [] },
    { id: 9, name: "Panna cotta framboise", desc: "Coulis frais, éclats de pistache", price: 7.5, tags: ["Sans gluten"] },
  ],
  boisson: [
    { id: 10, name: "Eau minérale", desc: "Plate ou gazeuse, 50cl", price: 3, tags: [] },
    { id: 11, name: "Jus de fruits frais", desc: "Orange, pomme ou pamplemousse", price: 4.5, tags: ["Végan"] },
    { id: 12, name: "Café ou thé", desc: "Sélection artisanale", price: 3.5, tags: [] },
  ],
};

const ALL_ITEMS = Object.values(MENU).flat();
const STEP_LABELS = ["Infos", "Jours", "Menus", "Récap"];
const SECTION_TITLES = { entree: "Entrées", plat: "Plats", dessert: "Desserts", boisson: "Boissons" };

const font = (sz, opts = {}) => ({
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontSize: sz,
  fontWeight: opts.bold ? 600 : 400,
  fontStyle: opts.italic ? "italic" : "normal",
  color: opts.color || C.dark,
  ...(opts.style || {}),
});

const sans = (sz, opts = {}) => ({
  fontFamily: "'Questrial', 'Segoe UI', Helvetica, sans-serif",
  fontSize: sz,
  fontWeight: opts.bold ? 600 : 400,
  color: opts.color || C.dark,
  letterSpacing: opts.tracking || 0,
  textTransform: opts.upper ? "uppercase" : "none",
  lineHeight: opts.lh || 1.5,
  ...(opts.style || {}),
});

const pill = (bg, color, border) => ({
  borderRadius: 50,
  background: bg,
  color: color,
  border: border ? `1.5px solid ${border}` : "none",
  cursor: "pointer",
  transition: "all 0.25s ease",
});

// === COMPONENTS ===

function Steps({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, padding: "0 8px" }}>
      {STEP_LABELS.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: i < current ? C.rose : i === current ? C.poudre : "transparent",
                border: `1.5px solid ${i <= current ? C.rose : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...sans(12, { color: i < current ? C.cream : i === current ? C.rose : C.vr }),
                transition: "all 0.35s ease",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ ...sans(9, { upper: true, tracking: "0.08em", color: i <= current ? C.rose : C.mutedLight }), marginTop: 5 }}>
              {l}
            </span>
          </div>
          {i < 3 && (
            <div style={{ flex: 1, height: 1, background: i < current ? C.rose : C.border, margin: "0 6px", marginBottom: 20, transition: "all 0.35s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Input({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={sans(10, { upper: true, tracking: "0.12em", color: C.rose })}>{label}</label>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          ...sans(15),
          padding: "11px 18px",
          ...pill("white", C.dark, focused ? C.rose : C.border),
          outline: "none",
          borderRadius: 50,
        }}
      />
    </div>
  );
}

function Card({ children, style: s }) {
  return (
    <div style={{ background: "white", borderRadius: 20, border: `1px solid ${C.border}`, padding: "26px 22px", ...s }}>
      {children}
    </div>
  );
}

function Btn({ children, primary, disabled, onClick, style: s, flex }) {
  const bg = disabled ? C.border : primary ? C.rose : "white";
  const clr = disabled ? C.mutedLight : primary ? C.cream : C.dark;
  const bdr = primary ? undefined : C.border;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sans(12, { upper: true, tracking: "0.12em", color: clr, bold: true }),
        padding: "13px 28px",
        ...pill(bg, clr, bdr),
        flex: flex || undefined,
        ...s,
      }}
    >
      {children}
    </button>
  );
}

function DayChip({ d, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...sans(12, { color: selected ? C.cream : C.dark }),
      padding: "10px 18px",
      ...pill(selected ? C.rose : "white", selected ? C.cream : C.dark, selected ? C.rose : C.border),
      display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 80,
    }}>
      <span style={{ fontWeight: 500 }}>{d.name}</span>
      <span style={{ fontSize: 11, opacity: 0.7 }}>{d.date}</span>
    </button>
  );
}

function SlotToggle({ value, onChange }) {
  return (
    <div style={{ display: "inline-flex", borderRadius: 50, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {["midi", "soir"].map((s) => (
        <button key={s} onClick={() => onChange(s)} style={{
          ...sans(11, { upper: true, tracking: "0.08em", color: value === s ? C.cream : C.vr }),
          padding: "7px 18px", border: "none",
          background: value === s ? C.rose : "transparent",
          cursor: "pointer", transition: "all 0.25s",
        }}>
          {s === "midi" ? "☀ Midi" : "☽ Soir"}
        </button>
      ))}
    </div>
  );
}

function MenuItem({ item, selected, onSelect }) {
  return (
    <button onClick={() => onSelect(item.id === selected ? null : item.id)} style={{
      width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 14,
      border: `1.5px solid ${selected ? C.rose : C.border}`,
      background: selected ? `${C.poudre}20` : "white",
      cursor: "pointer", transition: "all 0.25s", display: "flex", gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          {selected && <span style={{ color: C.rose, fontSize: 13, lineHeight: 1 }}>✓</span>}
          <span style={sans(14, { color: selected ? C.rose : C.dark, bold: selected })}>{item.name}</span>
        </div>
        <p style={sans(12, { color: C.muted, lh: 1.4, style: { margin: 0 } })}>{item.desc}</p>
        {item.tags.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
            {item.tags.map((t) => (
              <span key={t} style={{
                ...sans(9, { upper: true, tracking: "0.05em", color: C.olive }),
                padding: "2px 7px", borderRadius: 50, background: `${C.olive}15`,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <span style={sans(14, { color: C.rose, bold: true, style: { whiteSpace: "nowrap" } })}>{item.price.toFixed(2)} €</span>
    </button>
  );
}

function MenuSection({ title, type, items, selectedId, onSelect }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ ...sans(10, { upper: true, tracking: "0.16em", color: C.vr }), marginBottom: 8, paddingBottom: 5, borderBottom: `1px solid ${C.border}` }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => <MenuItem key={item.id} item={item} selected={selectedId === item.id} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

function RecapLine({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
      <span style={sans(13, { color: C.muted })}>{label}</span>
      <span style={sans(13, { color: C.dark, bold })}>{value}</span>
    </div>
  );
}

// === MAIN APP ===
export default function OrderPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ first_name: "", last_name: "", stand: "", phone: "", email: "" });
  const [selDays, setSelDays] = useState([]);
  const [slots, setSlots] = useState({});
  const [menus, setMenus] = useState({});
  const [activeDay, setActiveDay] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const toggleDay = useCallback((key) => {
    setSelDays((p) => {
      if (p.includes(key)) {
        setMenus((m) => { const { [key]: _, ...r } = m; return r; });
        setSlots((s) => { const { [key]: _, ...r } = s; return r; });
        return p.filter((d) => d !== key);
      }
      setSlots((s) => ({ ...s, [key]: "midi" }));
      setActiveDay(key);
      return [...p, key].sort();
    });
  }, []);

  const setChoice = useCallback((day, type, id) => {
    setMenus((p) => ({ ...p, [day]: { ...(p[day] || {}), [type]: id } }));
  }, []);

  const total = selDays.reduce((sum, d) => {
    const m = menus[d] || {};
    return sum + Object.values(m).reduce((s, id) => {
      const it = id ? ALL_ITEMS.find((i) => i.id === id) : null;
      return s + (it?.price || 0);
    }, 0);
  }, 0);

  const mealCount = selDays.filter((d) => menus[d] && Object.values(menus[d]).some(Boolean)).length;
  const formOk = form.first_name && form.last_name && form.stand && form.phone && form.email;

  const dayInfo = (key) => DAYS.find((d) => d.key === key);

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${C.olive}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            ✓
          </div>
          <h2 style={{ ...font(28, { italic: true, color: C.rose }), marginBottom: 8 }}>Merci, {form.first_name} !</h2>
          <p style={sans(14, { color: C.muted, lh: 1.6, style: { marginBottom: 20 } })}>
            Votre commande de <strong style={{ color: C.rose }}>{total.toFixed(2)} €</strong> pour {mealCount} repas a bien été enregistrée.
            Un email de confirmation vous sera envoyé à {form.email}.
          </p>
          <div style={{ padding: "12px 16px", borderRadius: 12, background: C.cream, marginBottom: 16 }}>
            <span style={sans(10, { upper: true, tracking: "0.1em", color: C.vr })}>N° commande</span>
            <div style={{ ...font(20, { color: C.rose }), marginTop: 4 }}>CMD-{Date.now().toString().slice(-6)}</div>
          </div>
          <Btn primary onClick={() => { setSubmitted(false); setStep(0); setForm({ first_name: "", last_name: "", stand: "", phone: "", email: "" }); setSelDays([]); setMenus({}); setSlots({}); }} style={{ width: "100%" }}>
            Nouvelle commande
          </Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, paddingBottom: step >= 2 ? 100 : 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { background: ${C.cream}; }
        input::placeholder { color: ${C.mutedLight}; }
        button:active { transform: scale(0.98); }
        ::-webkit-scrollbar { height: 3px; }
        ::-webkit-scrollbar-thumb { background: ${C.poudre}; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: "center", padding: "32px 20px 20px", borderBottom: `1px solid ${C.border}`, background: "white" }}>
        <div style={{ marginBottom: 8, fontSize: 24, lineHeight: 1, color: C.rose, opacity: 0.5 }}>❋</div>
        <p style={sans(10, { upper: true, tracking: "0.28em", color: C.vr, style: { marginBottom: 2 } })}>Maison</p>
        <h1 style={{ ...font(34, { italic: true, color: C.rose }), margin: "0 0 6px" }}>Félicien</h1>
        <p style={sans(12, { color: C.muted, tracking: "0.03em" })}>{EVENT.name} · 16 – 20 mars 2026</p>
      </header>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px 0" }}>
        <Steps current={step} />

        <div style={{ marginTop: 20 }}>
          {/* Step 0: Info */}
          {step === 0 && (
            <Card>
              <h2 style={{ ...font(22, { italic: true, color: C.rose }), marginBottom: 20 }}>Vos coordonnées</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="Prénom" placeholder="Jean" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  <Input label="Nom" placeholder="Dupont" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <Input label="Stand" placeholder="A-42" value={form.stand} onChange={(e) => setForm({ ...form, stand: e.target.value })} />
                <Input label="Téléphone" type="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label="Email" type="email" placeholder="jean@entreprise.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <Btn primary disabled={!formOk} onClick={() => setStep(1)} style={{ width: "100%", marginTop: 22 }}>
                Continuer →
              </Btn>
            </Card>
          )}

          {/* Step 1: Days */}
          {step === 1 && (
            <Card>
              <h2 style={{ ...font(22, { italic: true, color: C.rose }), marginBottom: 6 }}>Vos jours de repas</h2>
              <p style={sans(13, { color: C.muted, style: { marginBottom: 18 } })}>Sélectionnez les jours où vous souhaitez commander.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
                {DAYS.map((d) => <DayChip key={d.key} d={d} selected={selDays.includes(d.key)} onClick={() => toggleDay(d.key)} />)}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
                <Btn onClick={() => setStep(0)} flex={1}>← Retour</Btn>
                <Btn primary disabled={selDays.length === 0} onClick={() => { setStep(2); setActiveDay(selDays[0]); }} flex={2}>
                  Choisir les menus →
                </Btn>
              </div>
            </Card>
          )}

          {/* Step 2: Menus */}
          {step === 2 && (
            <div>
              {/* Day tabs */}
              <div style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto", paddingBottom: 3 }}>
                {selDays.map((k) => {
                  const d = dayInfo(k);
                  const active = activeDay === k;
                  const done = menus[k] && Object.values(menus[k]).some(Boolean);
                  return (
                    <button key={k} onClick={() => setActiveDay(k)} style={{
                      ...sans(11, { color: active ? C.cream : C.dark }),
                      padding: "7px 14px", whiteSpace: "nowrap",
                      ...pill(active ? C.rose : done ? `${C.poudre}40` : "white", active ? C.cream : C.dark, active ? C.rose : done ? C.poudre : C.border),
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      {done && !active && <span style={{ color: C.olive, fontSize: 10 }}>✓</span>}
                      {d.name} {d.date}
                    </button>
                  );
                })}
              </div>

              {activeDay && (
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <h2 style={{ ...font(20, { italic: true, color: C.rose }), margin: 0 }}>
                      {dayInfo(activeDay)?.name} {dayInfo(activeDay)?.date}
                    </h2>
                    <SlotToggle value={slots[activeDay] || "midi"} onChange={(s) => setSlots((p) => ({ ...p, [activeDay]: s }))} />
                  </div>
                  {Object.entries(SECTION_TITLES).map(([type, title]) => (
                    <MenuSection key={type} title={title} type={type} items={MENU[type]}
                      selectedId={menus[activeDay]?.[type]}
                      onSelect={(id) => setChoice(activeDay, type, id)} />
                  ))}
                </Card>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Btn onClick={() => setStep(1)} flex={1}>← Jours</Btn>
                <Btn primary disabled={!mealCount} onClick={() => setStep(3)} flex={2}>
                  Voir le récapitulatif →
                </Btn>
              </div>
            </div>
          )}

          {/* Step 3: Recap */}
          {step === 3 && (
            <Card>
              <h2 style={{ ...font(22, { italic: true, color: C.rose }), marginBottom: 18 }}>Récapitulatif</h2>

              <div style={{ padding: "12px 14px", borderRadius: 12, background: C.cream, marginBottom: 18 }}>
                <div style={sans(11, { upper: true, tracking: "0.1em", color: C.vr, style: { marginBottom: 4 } })}>Client</div>
                <div style={sans(14, { color: C.dark, bold: true })}>{form.first_name} {form.last_name}</div>
                <div style={sans(12, { color: C.muted })}>Stand {form.stand} · {form.email}</div>
              </div>

              {selDays.map((k) => {
                const d = dayInfo(k);
                const m = menus[k] || {};
                const dayTotal = Object.values(m).reduce((s, id) => s + (ALL_ITEMS.find((i) => i.id === id)?.price || 0), 0);
                if (dayTotal === 0) return null;
                return (
                  <div key={k} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={sans(12, { upper: true, tracking: "0.1em", color: C.rose, bold: true })}>{d.name} {d.date}</span>
                      <span style={{ ...sans(9, { upper: true, tracking: "0.06em", color: C.vr }), padding: "2px 8px", borderRadius: 50, background: `${C.poudre}40` }}>
                        {slots[k] || "midi"}
                      </span>
                    </div>
                    {Object.entries(m).map(([type, id]) => {
                      if (!id) return null;
                      const it = ALL_ITEMS.find((i) => i.id === id);
                      return (
                        <RecapLine key={type} label={`${SECTION_TITLES[type]} : ${it.name}`} value={`${it.price.toFixed(2)} €`} />
                      );
                    })}
                    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 4 }}>
                      <RecapLine label="Sous-total" value={`${dayTotal.toFixed(2)} €`} bold />
                    </div>
                  </div>
                );
              })}

              <div style={{ borderTop: `2px solid ${C.rose}`, marginTop: 8, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={sans(13, { upper: true, tracking: "0.1em", color: C.rose, bold: true })}>Total</span>
                <span style={{ ...font(28, { italic: true, color: C.rose }) }}>{total.toFixed(2)} €</span>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
                <Btn onClick={() => setStep(2)} flex={1}>← Menus</Btn>
                <Btn primary onClick={() => setSubmitted(true)} flex={2}>
                  Valider et payer →
                </Btn>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Sticky footer on menu step */}
      {step === 2 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, background: "white",
          borderTop: `1px solid ${C.border}`, padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 -3px 16px rgba(57,45,49,0.05)", zIndex: 100,
        }}>
          <div>
            <div style={sans(10, { upper: true, tracking: "0.08em", color: C.muted })}>{mealCount} repas</div>
            <div style={{ ...font(22, { italic: true, color: C.rose }) }}>{total.toFixed(2)} €</div>
          </div>
          <Btn primary disabled={!mealCount} onClick={() => setStep(3)}>Récapitulatif →</Btn>
        </div>
      )}
    </div>
  );
}
