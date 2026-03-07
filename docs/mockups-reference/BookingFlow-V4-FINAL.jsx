import { useState, useMemo } from "react";

/*
 * MAISON FÉLICIEN — Booking Flow V4 FINAL
 *
 * Step 0: Infos (nom, stand, tel, email)
 * Step 1: Créneaux & Convives — MATRICE (noms une fois + cross-table checkboxes)
 * Step 2: Menus — toggle même menu + collapse catégories + funnel + auto-fill modal
 * Step 3: Récap + payer
 */

const C = {
  rose: "#8B3A43", vr: "#BF646D", poudre: "#E5B7B3", olive: "#968A42",
  cream: "#F0F0E6", dark: "#392D31", white: "#FDFAF7", border: "#E5D9D0",
  muted: "#9A8A7C", green: "#4A7C59", orange: "#C4793A",
};
const sans = (sz, o = {}) => ({ fontFamily: "'Questrial',sans-serif", fontSize: sz, fontWeight: o.bold ? 600 : 400, color: o.color || C.dark, letterSpacing: o.tracking || 0, textTransform: o.upper ? "uppercase" : "none" });
const serif = (sz, o = {}) => ({ fontFamily: "'Georgia',serif", fontSize: sz, fontWeight: 400, fontStyle: "italic", color: o.color || C.rose });

const SLOTS = [
  { key: "s1", label: "Sam. 28", sub: "Midi", icon: "☀", price: 24 },
  { key: "s2", label: "Dim. 1", sub: "Midi", icon: "☀", price: 24 },
  { key: "s3", label: "Dim. 1", sub: "Soir", icon: "☽", price: 28 },
];

const MENU = {
  entree: [
    { id: 1, name: "Terrine de campagne", desc: "Cornichons, pain de campagne" },
    { id: 2, name: "Salade César", desc: "Romaine, parmesan, croûtons" },
    { id: 3, name: "Velouté de butternut", desc: "Noisettes, crème d'estragon" },
  ],
  plat: [
    { id: 4, name: "Filet de saumon grillé", desc: "Riz basmati, sauce aneth" },
    { id: 5, name: "Suprême de volaille", desc: "Purée truffée, légumes glacés" },
    { id: 6, name: "Risotto aux cèpes", desc: "Parmesan 24 mois, roquette" },
  ],
  dessert: [
    { id: 7, name: "Salade de fruits", desc: "Fruits de saison, menthe" },
    { id: 8, name: "Fondant chocolat", desc: "Cœur coulant, glace vanille" },
    { id: 9, name: "Crème brûlée", desc: "Vanille de Madagascar" },
  ],
  boisson: [
    { id: 10, name: "Café espresso", desc: "" },
    { id: 11, name: "Thé vert bio", desc: "" },
    { id: 12, name: "Jus de fruits", desc: "Orange, pomme, pamplemousse" },
  ],
};
const ALL_ITEMS = Object.values(MENU).flat();
const CATS = [
  { key: "entree", label: "Entrée", emoji: "🥗" },
  { key: "plat", label: "Plat", emoji: "🍽" },
  { key: "dessert", label: "Dessert", emoji: "🍰" },
  { key: "boisson", label: "Boisson", emoji: "🥤" },
];

/* ═══ UI PRIMITIVES ═══ */
function Chk({ checked, onChange, size = 26 }) {
  return (<button onClick={onChange} style={{ width: size, height: size, borderRadius: 6, flexShrink: 0, border: `2px solid ${checked ? C.rose : C.border}`, background: checked ? C.rose : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>{checked && <span style={{ color: "white", fontSize: size * 0.5 }}>✓</span>}</button>);
}
function MfInput({ label, value, onChange, placeholder, type = "text" }) {
  const [f, sF] = useState(false);
  return (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={sans(10, { upper: true, tracking: "0.12em", color: C.rose })}>{label}</label><input type={type} value={value} onChange={onChange} placeholder={placeholder} onFocus={() => sF(true)} onBlur={() => sF(false)} style={{ ...sans(15), padding: "11px 18px", borderRadius: 50, border: `1.5px solid ${f ? C.rose : C.border}`, outline: "none", background: "white" }} /></div>);
}
function Card({ children, style: s }) { return <div style={{ background: "white", borderRadius: 20, border: `1px solid ${C.border}`, padding: "22px 18px", ...s }}>{children}</div>; }
function Btn({ children, onClick, disabled, v = "primary", style: s }) {
  const bg = disabled ? C.border : v === "primary" ? C.rose : v === "green" ? C.green : "white";
  const cl = disabled ? C.muted : (v === "primary" || v === "green") ? C.cream : C.dark;
  return (<button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "14px 0", borderRadius: 50, border: v === "outline" ? `1.5px solid ${C.border}` : "none", background: bg, cursor: disabled ? "default" : "pointer", minHeight: 50, ...sans(13, { upper: true, tracking: "0.1em", color: cl, bold: true }), display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s", animation: !disabled && v === "primary" ? "pulse 2.5s ease infinite" : "none", ...s }}>{children}</button>);
}
function BlurModal({ children, onClose }) {
  return (<div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}><div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(57,45,49,0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", animation: "fadeIn 0.3s ease" }} /><div style={{ position: "relative", background: "white", borderRadius: 24, padding: "30px 24px 24px", maxWidth: 380, width: "100%", boxShadow: "0 24px 80px rgba(57,45,49,0.18)", animation: "modalIn 0.4s ease both", textAlign: "center" }}>{children}</div></div>);
}
function StepBar({ current }) {
  const st = ["Infos", "Créneaux", "Menus", "Récap"];
  return (<div style={{ display: "flex", alignItems: "flex-start", padding: "12px 20px", background: "white", borderBottom: `1px solid ${C.border}` }}>{st.map((l, i) => (<div key={i} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: i < current ? C.rose : i === current ? C.poudre : "transparent", border: `1.5px solid ${i <= current ? C.rose : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", ...sans(11, { color: i < current ? C.cream : i === current ? C.rose : C.muted }), transition: "all 0.3s" }}>{i < current ? "✓" : i + 1}</div><span style={{ ...sans(8, { upper: true, tracking: "0.06em", color: i <= current ? C.rose : C.muted }), marginTop: 3 }}>{l}</span></div>{i < 3 && <div style={{ flex: 1, height: 1, background: i < current ? C.rose : C.border, margin: "0 6px", marginBottom: 16 }} />}</div>))}</div>);
}
function CatSection({ cat, selectedId, onSelect }) {
  const item = selectedId ? ALL_ITEMS.find(i => i.id === selectedId) : null;
  const [open, setOpen] = useState(!item);
  const isOpen = !item || open;
  return (
    <div style={{ marginBottom: 8, borderRadius: 14, overflow: "hidden", border: `1px solid ${item && !isOpen ? `${C.green}22` : C.border}` }}>
      <button onClick={() => item && setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "none", border: "none", cursor: item ? "pointer" : "default", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 15 }}>{cat.emoji}</span><span style={sans(10, { upper: true, tracking: "0.1em", color: C.rose, bold: true })}>{cat.label}</span>{!item && <span style={sans(9, { color: C.muted })}>obligatoire</span>}</div>
        {item && !isOpen && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: C.green, fontSize: 11 }}>✓</span><span style={sans(12, { color: C.dark })}>{item.name}</span><span style={sans(10, { color: C.vr })}>modifier</span></div>}
      </button>
      <div style={{ maxHeight: isOpen ? 400 : 0, overflow: "hidden", transition: "max-height 0.3s ease", padding: isOpen ? "0 14px 10px" : "0 14px" }}>
        {MENU[cat.key].map(mi => (
          <button key={mi.id} onClick={() => { onSelect(mi.id); setTimeout(() => setOpen(false), 280); }} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${selectedId === mi.id ? C.rose : C.border}`, background: selectedId === mi.id ? `${C.poudre}22` : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: `2px solid ${selectedId === mi.id ? C.rose : C.border}`, background: selectedId === mi.id ? C.rose : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>{selectedId === mi.id && <span style={{ color: "white", fontSize: 10 }}>✓</span>}</div>
            <div><div style={sans(13, { color: selectedId === mi.id ? C.rose : C.dark, bold: selectedId === mi.id })}>{mi.name}</div>{mi.desc && <div style={sans(11, { color: C.muted })}>{mi.desc}</div>}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function BookingV4() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ last_name: "", stand: "", phone: "", email: "" });

  // Step 1 — matrix
  const [convives, setConvives] = useState([]);
  const [newName, setNewName] = useState("");
  const [matrix, setMatrix] = useState({}); // matrix[name][slotKey]=bool

  // Step 2 — menus
  const [menuSlotIdx, setMenuSlotIdx] = useState(0);
  const [sameForAll, setSameForAll] = useState(true);
  const [activeConvive, setActiveConvive] = useState(0);
  const [selections, setSelections] = useState({}); // sel[slotKey][convOrAll][catKey]=itemId
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [autoFillDone, setAutoFillDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Matrix helpers
  const isChk = (c, s) => !!(matrix[c]?.[s]);
  const tog = (c, s) => setMatrix(p => ({ ...p, [c]: { ...(p[c] || {}), [s]: !isChk(c, s) } }));
  const togRow = (c) => { const all = SLOTS.every(s => isChk(c, s.key)); setMatrix(p => ({ ...p, [c]: Object.fromEntries(SLOTS.map(s => [s.key, !all])) })); };
  const togCol = (sk) => { const all = convives.every(c => isChk(c, sk)); setMatrix(p => { const m = { ...p }; convives.forEach(c => { m[c] = { ...(m[c] || {}), [sk]: !all }; }); return m; }); };
  const selAll = () => { const m = {}; convives.forEach(c => { m[c] = {}; SLOTS.forEach(s => { m[c][s.key] = true; }); }); setMatrix(m); };
  const clrAll = () => setMatrix({});
  const isAllSel = convives.length > 0 && convives.every(c => SLOTS.every(s => isChk(c, s.key)));
  const isRowAll = c => SLOTS.every(s => isChk(c, s.key));
  const isColAll = sk => convives.length > 0 && convives.every(c => isChk(c, sk));
  const addConvive = n => { const t = n.trim(); if (t && !convives.includes(t)) { setConvives([...convives, t]); setNewName(""); } };
  const rmConvive = n => { setConvives(convives.filter(c => c !== n)); setMatrix(p => { const m = { ...p }; delete m[n]; return m; }); };

  // Active slots/convives from matrix
  const activeSlots = useMemo(() => SLOTS.filter(s => convives.some(c => isChk(c, s.key))), [matrix, convives]);
  const slotConvives = useMemo(() => {
    const sc = {};
    activeSlots.forEach(s => { sc[s.key] = convives.filter(c => isChk(c, s.key)); });
    return sc;
  }, [matrix, convives, activeSlots]);
  const totalMeals = convives.reduce((s, c) => s + SLOTS.filter(sl => isChk(c, sl.key)).length, 0);
  const totalEstimate = convives.reduce((s, c) => s + SLOTS.filter(sl => isChk(c, sl.key)).reduce((ss, sl) => ss + sl.price, 0), 0);

  // Menu helpers
  const currentSlot = activeSlots[menuSlotIdx];
  const currentConv = currentSlot ? (slotConvives[currentSlot.key] || []) : [];
  const getSelKey = () => sameForAll ? "__all__" : currentConv[activeConvive];
  const getSel = (sk, k) => (selections[sk] || {})[k] || {};
  const curSel = currentSlot ? getSel(currentSlot.key, getSelKey()) : {};
  const isMenuDone = CATS.every(c => curSel[c.key]);
  const isConvDone = (sk, n) => CATS.every(c => getSel(sk, n)[c.key]);
  const isSlotDone = sk => { const cv = slotConvives[sk] || []; return sameForAll ? CATS.every(c => getSel(sk, "__all__")[c.key]) : cv.every(n => isConvDone(sk, n)); };
  const doneSlots = activeSlots.filter(s => isSlotDone(s.key)).length;
  const allDone = doneSlots === activeSlots.length;
  const isLastSlot = menuSlotIdx === activeSlots.length - 1;
  const allConvThisSlot = sameForAll ? isMenuDone : currentConv.every(n => isConvDone(currentSlot?.key, n));
  const menuTotal = activeSlots.reduce((s, sl) => s + (isSlotDone(sl.key) ? sl.price * (slotConvives[sl.key]?.length || 0) : 0), 0);

  const setChoice = (cat, id) => { const sk = currentSlot.key; const k = getSelKey(); setSelections(p => ({ ...p, [sk]: { ...(p[sk] || {}), [k]: { ...((p[sk] || {})[k] || {}), [cat]: ((p[sk] || {})[k] || {})[cat] === id ? null : id, _pf: false } } })); };
  const handleMenuToggle = v => {
    if (!v && sameForAll && currentSlot) { const sh = getSel(currentSlot.key, "__all__"); const ns = { ...(selections[currentSlot.key] || {}) }; currentConv.forEach(n => { if (!ns[n] || !CATS.some(c => ns[n][c.key])) ns[n] = { ...sh, _pf: true }; }); setSelections(p => ({ ...p, [currentSlot.key]: ns })); }
    setSameForAll(v); setActiveConvive(0);
  };
  const handleValidateSlot = () => {
    if (menuSlotIdx === 0 && !autoFillDone && activeSlots.length > 1) { setShowAutoFill(true); return; }
    if (!isLastSlot) { setMenuSlotIdx(i => i + 1); setSameForAll(true); setActiveConvive(0); }
  };
  const handleAutoFill = () => {
    const f = selections[activeSlots[0].key];
    const ns = { ...selections };
    activeSlots.slice(1).forEach(s => { ns[s.key] = {}; if (f) Object.entries(f).forEach(([k, v]) => { ns[s.key][k] = { ...v, _pf: true }; }); });
    setSelections(ns); setAutoFillDone(true); setShowAutoFill(false); setMenuSlotIdx(1);
  };

  const formOk = form.last_name && form.stand && form.phone && form.email;

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap'); * { box-sizing:border-box;margin:0; }`}</style>
      <Card style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 28, color: C.green }}>✓</div>
        <h2 style={{ ...serif(26), marginBottom: 6 }}>Merci !</h2>
        <p style={{ ...sans(14, { color: C.muted }), marginBottom: 16 }}>Commande de <strong style={{ color: C.rose }}>{menuTotal.toFixed(2)} €</strong> enregistrée.</p>
        <div style={{ padding: "10px 14px", borderRadius: 12, background: C.cream, marginBottom: 16 }}><div style={sans(10, { upper: true, tracking: "0.1em", color: C.vr })}>N° commande</div><div style={{ ...serif(20), marginTop: 3 }}>CMD-{Date.now().toString().slice(-6)}</div></div>
        <Btn onClick={() => { setSubmitted(false); setStep(0); setSelections({}); setAutoFillDone(false); setMenuSlotIdx(0); }}>Nouvelle commande</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.cream, paddingBottom: step >= 2 ? 90 : 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing:border-box;margin:0; } body { background:${C.cream}; }
        input::placeholder { color:${C.muted}; }
        button:active { transform:scale(0.97); }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.92) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.02)} }
      `}</style>

      <header style={{ textAlign: "center", padding: "16px 16px 10px", background: "white" }}>
        <div style={{ fontSize: 14, color: C.rose, opacity: 0.4 }}>❋</div>
        <p style={sans(8, { upper: true, tracking: "0.3em", color: C.vr })}>Maison</p>
        <h1 style={{ ...serif(24), margin: 0 }}>Félicien</h1>
        <p style={{ ...sans(10, { color: C.muted }), marginTop: 3 }}>Salon du Bâtiment · 28 févr. — 2 mars 2026</p>
      </header>
      <StepBar current={step} />

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "16px" }}>

        {/* ═══ STEP 0 — INFOS ═══ */}
        {step === 0 && (
          <Card>
            <h2 style={{ ...serif(22), marginBottom: 18 }}>Vos coordonnées</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <MfInput label="Nom" placeholder="Dupont" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              <MfInput label="Stand" placeholder="A-42" value={form.stand} onChange={e => setForm({ ...form, stand: e.target.value })} />
              <MfInput label="Téléphone" placeholder="06 12 34 56 78" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <MfInput label="Email" placeholder="contact@entreprise.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <Btn onClick={() => setStep(1)} disabled={!formOk} style={{ marginTop: 18 }}>Continuer →</Btn>
          </Card>
        )}

        {/* ═══ STEP 1 — MATRIX CRÉNEAUX × CONVIVES ═══ */}
        {step === 1 && (<div>
          {/* Add convives */}
          <Card style={{ marginBottom: 12 }}>
            <h2 style={{ ...serif(20), marginBottom: 4 }}>Votre équipe</h2>
            <p style={{ ...sans(12, { color: C.muted }), marginBottom: 12 }}>Ajoutez les prénoms de chaque personne, une seule fois.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {convives.map(n => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 7px 6px 10px", borderRadius: 50, background: `${C.poudre}28`, border: `1px solid ${C.poudre}` }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.rose, display: "flex", alignItems: "center", justifyContent: "center", ...sans(11, { color: C.cream, bold: true }) }}>{n[0]}</div>
                  <span style={sans(13, { color: C.dark })}>{n}</span>
                  <button onClick={() => rmConvive(n)} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: `${C.rose}12`, cursor: "pointer", ...sans(12, { color: C.rose }), display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
            </div>
            {convives.length < 6 && (
              <div style={{ display: "flex", gap: 6 }}>
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addConvive(newName)} placeholder="Prénom" style={{ ...sans(14), flex: 1, padding: "10px 16px", borderRadius: 50, border: `1.5px solid ${C.border}`, outline: "none" }} />
                <button onClick={() => addConvive(newName)} disabled={!newName.trim()} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: newName.trim() ? C.rose : C.border, cursor: newName.trim() ? "pointer" : "default", ...sans(20, { color: newName.trim() ? C.cream : C.muted }), display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            )}
          </Card>

          {/* Matrix */}
          {convives.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ ...serif(20), margin: 0 }}>Qui mange quand ?</h2>
                <button onClick={isAllSel ? clrAll : selAll} style={{ ...sans(10, { upper: true, tracking: "0.06em", color: isAllSel ? C.vr : C.olive, bold: true }), padding: "5px 12px", borderRadius: 50, background: isAllSel ? `${C.vr}10` : `${C.olive}10`, border: "none", cursor: "pointer" }}>{isAllSel ? "✕ Décocher" : "⚡ Tout cocher"}</button>
              </div>

              {/* Mobile: cards per convive */}
              {convives.map(name => (
                <div key={name} style={{ padding: "12px 14px", borderRadius: 14, marginBottom: 8, border: `1px solid ${isRowAll(name) ? `${C.green}25` : C.border}`, background: isRowAll(name) ? `${C.green}04` : "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: isRowAll(name) ? C.rose : `${C.poudre}40`, display: "flex", alignItems: "center", justifyContent: "center", ...sans(13, { color: isRowAll(name) ? C.cream : C.dark, bold: true }) }}>{name[0]}</div>
                      <span style={sans(15, { color: C.dark, bold: true })}>{name}</span>
                    </div>
                    <button onClick={() => togRow(name)} style={{ ...sans(10, { upper: true, tracking: "0.06em", color: isRowAll(name) ? C.vr : C.olive }), padding: "4px 10px", borderRadius: 50, background: isRowAll(name) ? `${C.vr}10` : `${C.olive}10`, border: "none", cursor: "pointer" }}>{isRowAll(name) ? "Décocher" : "⚡ Tous"}</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {SLOTS.map(s => {
                      const ck = isChk(name, s.key);
                      return (<button key={s.key} onClick={() => tog(name, s.key)} style={{ padding: "7px 12px", borderRadius: 50, border: `1.5px solid ${ck ? C.rose : C.border}`, background: ck ? `${C.poudre}22` : "white", cursor: "pointer", ...sans(11, { color: ck ? C.rose : C.muted }), display: "flex", alignItems: "center", gap: 4 }}>{ck && <span style={{ fontSize: 10 }}>✓</span>}{s.icon} {s.label} {s.sub}</button>);
                    })}
                  </div>
                  <div style={{ marginTop: 5, ...sans(11, { color: C.muted }) }}>{SLOTS.filter(s => isChk(name, s.key)).length} créneau{SLOTS.filter(s => isChk(name, s.key)).length > 1 ? "x" : ""}{SLOTS.filter(s => isChk(name, s.key)).length > 0 && <span style={{ color: C.olive }}> · {SLOTS.filter(s => isChk(name, s.key)).reduce((a, s) => a + s.price, 0)}€</span>}</div>
                </div>
              ))}

              {/* Summary */}
              <div style={{ padding: "12px", borderRadius: 12, background: C.cream, marginTop: 8 }}>
                {SLOTS.filter(s => convives.some(c => isChk(c, s.key))).map(s => {
                  const cnt = convives.filter(c => isChk(c, s.key)).length;
                  return (<div key={s.key} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span style={sans(11, { color: C.muted })}>{s.icon} {s.label} {s.sub} · {cnt}p</span><span style={sans(11, { color: C.dark })}>{cnt * s.price}€</span></div>);
                })}
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}><span style={sans(13, { color: C.rose, bold: true })}>Estimation</span><span style={serif(18)}>{totalEstimate} €</span></div>
              </div>
            </Card>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => setStep(0)} v="outline" style={{ flex: 1 }}>← Infos</Btn>
            <Btn onClick={() => { setStep(2); setMenuSlotIdx(0); setSameForAll(true); setActiveConvive(0); }} disabled={totalMeals === 0} style={{ flex: 2 }}>{totalMeals > 0 ? `Choisir les menus (${totalMeals} repas) →` : "Sélectionnez au moins 1 créneau"}</Btn>
          </div>
        </div>)}

        {/* ═══ STEP 2 — MENUS ═══ */}
        {step === 2 && currentSlot && (<div>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
            {activeSlots.map((s, i) => {
              const a = i === menuSlotIdx; const d = isSlotDone(s.key); const cv = slotConvives[s.key] || [];
              return (<button key={s.key} onClick={() => { setMenuSlotIdx(i); setSameForAll(true); setActiveConvive(0); }} style={{ ...sans(11, { color: a ? C.cream : C.dark }), padding: "6px 12px", whiteSpace: "nowrap", borderRadius: 50, background: a ? C.rose : d ? `${C.poudre}40` : "white", border: `1.5px solid ${a ? C.rose : d ? C.poudre : C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>{d && !a && <span style={{ fontSize: 9, color: getSel(s.key, "__all__")._pf ? C.olive : C.green }}>{getSel(s.key, "__all__")._pf ? "⚡" : "✓"}</span>}{s.icon} {s.label} {s.sub}<span style={sans(9, { color: a ? C.poudre : C.muted })}>{cv.length}p</span></button>);
            })}
          </div>

          <div style={{ padding: "8px 14px", borderRadius: 10, background: "white", border: `1px solid ${C.border}`, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={sans(11, { color: C.dark })}>Créneau <strong>{menuSlotIdx + 1}</strong>/{activeSlots.length}</span><span style={sans(11, { color: allDone ? C.green : C.rose, bold: true })}>{doneSlots}/{activeSlots.length}</span></div>
            <div style={{ height: 4, borderRadius: 2, background: C.cream }}><div style={{ height: "100%", borderRadius: 2, background: allDone ? C.green : C.rose, width: `${(doneSlots / activeSlots.length) * 100}%`, transition: "width 0.4s" }} /></div>
          </div>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h2 style={{ ...serif(18), margin: 0 }}>{currentSlot.label} — {currentSlot.sub}</h2>
              <span style={{ ...sans(11, { color: C.olive, bold: true }), padding: "3px 10px", borderRadius: 50, background: `${C.olive}12` }}>{currentSlot.price * currentConv.length}€</span>
            </div>

            <div style={{ display: "flex", gap: 5, margin: "8px 0", paddingBottom: 8, borderBottom: `1px solid ${C.cream}` }}>
              {currentConv.map((n, i) => { const d = sameForAll ? isMenuDone : isConvDone(currentSlot.key, n); const ac = !sameForAll && i === activeConvive;
                return (<div key={n} onClick={() => !sameForAll && setActiveConvive(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: sameForAll ? 0.45 : 1, cursor: sameForAll ? "default" : "pointer" }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: ac ? C.rose : d ? `${C.green}15` : `${C.poudre}30`, border: ac ? `2px solid ${C.rose}` : d ? `2px solid ${C.green}35` : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", ...sans(13, { color: ac ? C.cream : C.dark, bold: true }) }}>{d && !ac ? <span style={{ color: C.green, fontSize: 12 }}>✓</span> : n[0]}</div><span style={sans(8, { color: ac ? C.rose : C.muted })}>{n}</span></div>);
              })}
            </div>

            {currentConv.length > 1 && (
              <button onClick={() => handleMenuToggle(!sameForAll)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 14, background: sameForAll ? `${C.olive}08` : "white", border: `1.5px solid ${sameForAll ? C.olive : C.border}`, cursor: "pointer", textAlign: "left", marginBottom: 10 }}>
                <div style={{ width: 38, height: 20, borderRadius: 10, padding: 2, background: sameForAll ? C.olive : C.border, display: "flex", alignItems: "center", flexShrink: 0 }}><div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", transform: sameForAll ? "translateX(18px)" : "translateX(0)", transition: "transform 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} /></div>
                <div><div style={sans(12, { color: C.dark, bold: true })}>Même menu pour tous</div>{sameForAll && <div style={sans(10, { color: C.olive })}>⚡ Un choix pour {currentConv.join(" & ")}</div>}</div>
              </button>
            )}

            {!sameForAll && (<div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto" }}>{currentConv.map((n, i) => { const d = isConvDone(currentSlot.key, n); const ac = i === activeConvive; return (<button key={n} onClick={() => setActiveConvive(i)} style={{ ...sans(11, { color: ac ? C.cream : C.dark }), padding: "5px 12px", borderRadius: 50, background: ac ? C.rose : d ? `${C.green}10` : "white", border: `1.5px solid ${ac ? C.rose : d ? `${C.green}30` : C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{d && !ac && <span style={{ fontSize: 9, color: C.green }}>✓</span>}{n}</button>); })}</div>)}

            {curSel._pf && <div style={{ padding: "6px 12px", borderRadius: 10, marginBottom: 8, background: `${C.olive}08`, border: `1px solid ${C.olive}18`, ...sans(11, { color: C.olive }), display: "flex", alignItems: "center", gap: 5 }}>⚡ Pré-rempli. Modifiez si besoin.</div>}

            {CATS.map(cat => <CatSection key={cat.key + currentSlot.key + getSelKey()} cat={cat} selectedId={curSel[cat.key]} onSelect={id => setChoice(cat.key, id)} />)}

            {!isLastSlot ? <Btn onClick={handleValidateSlot} disabled={!allConvThisSlot} style={{ marginTop: 6 }}>{allConvThisSlot ? "Valider ma sélection →" : "Complétez les menus"}</Btn>
              : <Btn onClick={() => setStep(3)} disabled={!allDone} v={allDone ? "green" : "primary"} style={{ marginTop: 6 }}>{allDone ? "Voir le récapitulatif →" : `${doneSlots}/${activeSlots.length} créneaux`}</Btn>}
          </Card>
          <Btn onClick={() => menuSlotIdx > 0 ? setMenuSlotIdx(i => i - 1) : setStep(1)} v="outline" style={{ marginTop: 10 }}>{menuSlotIdx > 0 ? "← Créneau précédent" : "‹ Créneaux & convives"}</Btn>
        </div>)}

        {/* ═══ STEP 3 — RECAP ═══ */}
        {step === 3 && (
          <Card>
            <h2 style={{ ...serif(22), marginBottom: 14 }}>Récapitulatif</h2>
            <div style={{ padding: "10px 14px", borderRadius: 14, background: C.cream, marginBottom: 14 }}>
              <div style={sans(10, { upper: true, tracking: "0.1em", color: C.vr })}>Client</div>
              <div style={sans(14, { color: C.dark, bold: true })}>Famille {form.last_name} · Stand {form.stand}</div>
              <div style={sans(12, { color: C.muted })}>{form.email} · {form.phone}</div>
            </div>

            {activeSlots.map(s => {
              const cv = slotConvives[s.key] || [];
              return (<div key={s.key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={sans(11, { upper: true, tracking: "0.08em", color: C.rose, bold: true })}>{s.icon} {s.label} — {s.sub}</span><span style={sans(12, { color: C.olive, bold: true })}>{cv.length * s.price}€</span></div>
                {(sameForAll ? ["__all__"] : cv).map(k => {
                  const sel = getSel(s.key, k); const nm = k === "__all__" ? cv.join(" & ") : k;
                  return (<div key={k} style={{ padding: "6px 10px", borderRadius: 10, background: `${C.cream}80`, marginBottom: 3 }}><div style={sans(12, { color: C.dark, bold: true, style: { marginBottom: 2 } })}>👤 {nm}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{CATS.map(cat => { const it = ALL_ITEMS.find(i => i.id === sel[cat.key]); return it ? <span key={cat.key} style={{ ...sans(10, { color: C.dark }), padding: "2px 7px", borderRadius: 50, background: "white", border: `1px solid ${C.border}` }}>{cat.emoji} {it.name}</span> : null; })}</div></div>);
                })}
                <div style={{ height: 1, background: C.border, marginTop: 8 }} />
              </div>);
            })}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 12, borderTop: `2px solid ${C.rose}` }}>
              <div><span style={sans(12, { upper: true, tracking: "0.1em", color: C.rose, bold: true })}>Total</span><div style={sans(11, { color: C.muted })}>{totalMeals} repas</div></div>
              <span style={serif(28)}>{menuTotal.toFixed(2)} €</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn onClick={() => setStep(2)} v="outline" style={{ flex: 1 }}>← Menus</Btn>
              <Btn onClick={() => setSubmitted(true)} v="green" style={{ flex: 2 }}>Valider et payer →</Btn>
            </div>
          </Card>
        )}
      </div>

      {/* Sticky footer */}
      {step === 2 && (<div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: `1px solid ${C.border}`, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -3px 16px rgba(57,45,49,0.05)", zIndex: 100 }}><div><div style={sans(10, { upper: true, tracking: "0.06em", color: C.muted })}>{doneSlots}/{activeSlots.length} créneaux</div><div style={serif(20)}>{menuTotal.toFixed(2)} €</div></div>{allDone && <button onClick={() => setStep(3)} style={{ ...sans(11, { upper: true, tracking: "0.1em", color: C.cream, bold: true }), padding: "11px 20px", borderRadius: 50, background: C.rose, border: "none", cursor: "pointer" }}>Récapitulatif →</button>}</div>)}

      {/* Auto-fill modal */}
      {showAutoFill && (<BlurModal onClose={() => { setAutoFillDone(true); setShowAutoFill(false); setMenuSlotIdx(1); }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", margin: "0 auto 12px", background: `linear-gradient(135deg, ${C.olive}20, ${C.poudre}40)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚡</div>
        <h3 style={{ ...serif(22), margin: "0 0 8px" }}>Même menu partout ?</h3>
        <p style={{ ...sans(13, { color: C.muted }), lineHeight: 1.6, margin: "0 0 6px" }}>Votre sélection du</p>
        <div style={{ padding: "8px 14px", borderRadius: 12, background: C.cream, display: "inline-block", marginBottom: 8, ...sans(14, { color: C.dark, bold: true }) }}>{activeSlots[0].icon} {activeSlots[0].label} — {activeSlots[0].sub}</div>
        <p style={{ ...sans(13, { color: C.muted }), margin: "0 0 18px" }}>sera appliquée aux <strong style={{ color: C.dark }}>{activeSlots.length - 1} autres créneaux</strong>.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn onClick={handleAutoFill}>⚡ Appliquer à tous</Btn>
          <Btn onClick={() => { setAutoFillDone(true); setShowAutoFill(false); setMenuSlotIdx(1); }} v="outline">Non, je choisis pour chaque</Btn>
        </div>
      </BlurModal>)}
    </div>
  );
}
