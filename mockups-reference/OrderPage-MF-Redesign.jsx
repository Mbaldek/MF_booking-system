import { useState, useCallback } from "react";

// === MF DESIGN TOKENS ===
const COLORS = {
  rose: "#8B3A43",
  vieuxRose: "#BF646D",
  poudre: "#E5B7B3",
  vertOlive: "#968A42",
  blancCasse: "#F0F0E6",
  marronGlace: "#392D31",
  white: "#FDFAF7",
  border: "#E5D9D0",
};

// Simulated data
const EVENT = {
  name: "Salon du Bâtiment 2026",
  location: "Paris Expo — Porte de Versailles",
  startDate: "2026-03-16",
  endDate: "2026-03-20",
};

const MENU_ITEMS = {
  entree: [
    { id: 1, name: "Velouté de butternut", desc: "Noisettes torréfiées, crème d'estragon", price: 8.5, tags: ["vegetarien"] },
    { id: 2, name: "Tartare de saumon", desc: "Agrumes, avocat, sésame noir", price: 10, tags: ["sans_gluten"] },
    { id: 3, name: "Salade de chèvre chaud", desc: "Miel de lavande, noix de pécan", price: 9, tags: ["vegetarien"] },
  ],
  plat: [
    { id: 4, name: "Suprême de volaille", desc: "Jus corsé, purée truffée, légumes glacés", price: 16, tags: [] },
    { id: 5, name: "Dos de cabillaud", desc: "Beurre blanc, risotto au safran", price: 18, tags: ["sans_gluten"] },
    { id: 6, name: "Risotto aux cèpes", desc: "Parmesan 24 mois, roquette", price: 15, tags: ["vegetarien"] },
  ],
  dessert: [
    { id: 7, name: "Crème brûlée vanille", desc: "Gousse de Madagascar", price: 7, tags: ["sans_gluten"] },
    { id: 8, name: "Fondant au chocolat", desc: "Cœur coulant, glace vanille", price: 8, tags: [] },
    { id: 9, name: "Panna cotta framboise", desc: "Coulis frais, éclats de pistache", price: 7.5, tags: ["sans_gluten"] },
  ],
  boisson: [
    { id: 10, name: "Eau minérale", desc: "Plate ou gazeuse, 50cl", price: 3, tags: [] },
    { id: 11, name: "Jus de fruits frais", desc: "Orange, pomme ou pamplemousse", price: 4.5, tags: ["vegan"] },
    { id: 12, name: "Café ou thé", desc: "Sélection artisanale", price: 3.5, tags: [] },
  ],
};

const DAYS = ["2026-03-16", "2026-03-17", "2026-03-18", "2026-03-19", "2026-03-20"];
const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const DAY_DATES = ["16 mars", "17 mars", "18 mars", "19 mars", "20 mars"];

const TAG_LABELS = {
  vegetarien: "Végétarien",
  vegan: "Végan",
  sans_gluten: "Sans gluten",
  sans_lactose: "Sans lactose",
  bio: "Bio",
};

// === SYMBOL SVG COMPONENT ===
const MFSymbol = ({ size = 32, color = COLORS.rose }) => (
  <svg width={size} height={size} viewBox="0 0 485 472" fill="none">
    <path
      d="M484.783 206.932C484.783 212.116 482.756 216.891 478.711 221.262C474.658 225.634 470.696 227.82 466.81 227.82C462.924 227.82 458.552 225.961 453.695 222.233C450.157 219.526 447.75 216.766 446.581 213.589C445.845 211.59 446.12 209.355 447.194 207.515C449.691 203.238 454.666 194.542 454.666 192.846C454.666 184.102 445.269 179.73 426.492 179.73C399.029 179.73 381.718 189.082 374.569 207.771C374.54 207.847 374.574 207.935 374.646 207.972C390.104 216.063 397.833 226.887 397.833 240.449C397.833 246.931 395.404 252.434 390.546 256.965C385.689 261.505 379.693 263.765 372.573 263.765C365.772 263.765 359.374 261.177 353.386 255.993C347.39 250.817 344.4 244.662 344.4 237.535C344.4 234.947 344.802 231.144 345.614 226.119C346.412 221.142 346.821 217.517 346.827 215.244C346.827 215.212 346.801 215.192 346.77 215.194C332.224 216.179 320.502 222.492 311.611 234.134C302.7 245.793 298.253 261.018 298.253 279.795C298.253 288.865 299.71 293.397 302.624 293.397C303.596 293.397 305.539 292.911 308.453 291.939C311.368 290.967 313.63 290.482 315.254 290.482C322.055 290.482 328.37 293.48 334.199 299.469C340.028 305.465 342.942 312.182 342.942 319.628C342.942 332.758 336.133 339.866 322.528 340.964"
      fill={color}
      opacity="0.15"
    />
  </svg>
);

// === STEP INDICATOR ===
const StepIndicator = ({ current, total = 4, labels }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", padding: "0 4px" }}>
    {labels.map((label, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < total - 1 ? 1 : "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 28 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: i < current ? COLORS.rose : i === current ? COLORS.poudre : "transparent",
              border: `1.5px solid ${i <= current ? COLORS.rose : COLORS.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Questrial, sans-serif",
              fontSize: 12,
              color: i < current ? COLORS.blancCasse : i === current ? COLORS.rose : COLORS.vieuxRose,
              transition: "all 0.4s ease",
            }}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            style={{
              fontFamily: "Questrial, sans-serif",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: i <= current ? COLORS.rose : "#B8A99A",
              marginTop: 6,
              whiteSpace: "nowrap",
              fontWeight: i === current ? 600 : 400,
            }}
          >
            {label}
          </span>
        </div>
        {i < total - 1 && (
          <div
            style={{
              flex: 1,
              height: 1,
              background: i < current ? COLORS.rose : COLORS.border,
              marginBottom: 22,
              marginLeft: 4,
              marginRight: 4,
              transition: "background 0.4s ease",
            }}
          />
        )}
      </div>
    ))}
  </div>
);

// === FORM INPUT ===
const MFInput = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label
      style={{
        fontFamily: "Questrial, sans-serif",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: COLORS.rose,
      }}
    >
      {label}
    </label>
    <input
      {...props}
      style={{
        fontFamily: "Questrial, sans-serif",
        fontSize: 15,
        padding: "12px 18px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 50,
        background: "white",
        color: COLORS.marronGlace,
        outline: "none",
        transition: "border-color 0.3s",
        ...(props.style || {}),
      }}
      onFocus={(e) => (e.target.style.borderColor = COLORS.rose)}
      onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
    />
  </div>
);

// === DAY CHIP ===
const DayChip = ({ dayName, date, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: "Questrial, sans-serif",
      padding: "10px 20px",
      borderRadius: 50,
      border: `1.5px solid ${selected ? COLORS.rose : COLORS.border}`,
      background: selected ? COLORS.rose : "white",
      color: selected ? COLORS.blancCasse : COLORS.marronGlace,
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      minWidth: 90,
    }}
  >
    <span style={{ fontSize: 13, fontWeight: 500 }}>{dayName}</span>
    <span style={{ fontSize: 11, opacity: 0.7 }}>{date}</span>
  </button>
);

// === SLOT TOGGLE (MIDI/SOIR) ===
const SlotToggle = ({ value, onChange }) => (
  <div
    style={{
      display: "inline-flex",
      borderRadius: 50,
      border: `1px solid ${COLORS.border}`,
      overflow: "hidden",
      background: "white",
    }}
  >
    {["midi", "soir"].map((slot) => (
      <button
        key={slot}
        onClick={() => onChange(slot)}
        style={{
          fontFamily: "Questrial, sans-serif",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "8px 22px",
          border: "none",
          background: value === slot ? COLORS.rose : "transparent",
          color: value === slot ? COLORS.blancCasse : COLORS.vieuxRose,
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
      >
        {slot === "midi" ? "☀ Midi" : "☽ Soir"}
      </button>
    ))}
  </div>
);

// === MENU ITEM CARD ===
const MenuItemCard = ({ item, selected, onSelect, type }) => {
  const typeIcons = { entree: "❋", plat: "◉", dessert: "✿", boisson: "◈" };
  return (
    <button
      onClick={() => onSelect(item.id === selected ? null : item.id)}
      style={{
        width: "100%",
        textAlign: "left",
        fontFamily: "Questrial, sans-serif",
        padding: "16px 20px",
        borderRadius: 16,
        border: `1.5px solid ${selected ? COLORS.rose : COLORS.border}`,
        background: selected ? `${COLORS.poudre}22` : "white",
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {selected && (
            <span style={{ color: COLORS.rose, fontSize: 14 }}>✓</span>
          )}
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: selected ? COLORS.rose : COLORS.marronGlace,
            }}
          >
            {item.name}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#9A8A7C", margin: 0, lineHeight: 1.4 }}>
          {item.desc}
        </p>
        {item.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {item.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 50,
                  background: `${COLORS.vertOlive}18`,
                  color: COLORS.vertOlive,
                }}
              >
                {TAG_LABELS[t] || t}
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: "Questrial, sans-serif",
          fontSize: 15,
          fontWeight: 500,
          color: COLORS.rose,
          whiteSpace: "nowrap",
        }}
      >
        {item.price.toFixed(2)} €
      </span>
    </button>
  );
};

// === MENU SECTION ===
const MenuSection = ({ title, items, selectedId, onSelect, type }) => (
  <div style={{ marginBottom: 24 }}>
    <h3
      style={{
        fontFamily: "Questrial, sans-serif",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: COLORS.vieuxRose,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {title}
    </h3>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          type={type}
          selected={selectedId === item.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  </div>
);

// === STICKY FOOTER ===
const StickyFooter = ({ total, itemCount, canSubmit, onSubmit }) => (
  <div
    style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "white",
      borderTop: `1px solid ${COLORS.border}`,
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 100,
      boxShadow: "0 -4px 20px rgba(57,45,49,0.06)",
    }}
  >
    <div>
      <div style={{ fontFamily: "Questrial, sans-serif", fontSize: 12, color: "#9A8A7C", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {itemCount} repas sélectionné{itemCount > 1 ? "s" : ""}
      </div>
      <div
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: 24,
          fontWeight: 400,
          color: COLORS.rose,
          fontStyle: "italic",
        }}
      >
        {total.toFixed(2)} €
      </div>
    </div>
    <button
      onClick={onSubmit}
      disabled={!canSubmit}
      style={{
        fontFamily: "Questrial, sans-serif",
        fontSize: 13,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "14px 36px",
        borderRadius: 50,
        border: "none",
        background: canSubmit ? COLORS.rose : COLORS.border,
        color: canSubmit ? COLORS.blancCasse : "#B8A99A",
        cursor: canSubmit ? "pointer" : "default",
        transition: "all 0.3s ease",
        fontWeight: 500,
      }}
    >
      Valider la commande
    </button>
  </div>
);

// === MAIN ORDER PAGE ===
export default function OrderPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ first_name: "", last_name: "", stand: "", phone: "", email: "" });
  const [selectedDays, setSelectedDays] = useState([]);
  const [daySlots, setDaySlots] = useState({});
  const [dayMenus, setDayMenus] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);

  const toggleDay = useCallback((day) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        setDayMenus((m) => { const { [day]: _, ...rest } = m; return rest; });
        setDaySlots((s) => { const { [day]: _, ...rest } = s; return rest; });
        return prev.filter((d) => d !== day);
      }
      setDaySlots((s) => ({ ...s, [day]: "midi" }));
      setExpandedDay(day);
      return [...prev, day].sort();
    });
  }, []);

  const setMenuChoice = useCallback((day, type, itemId) => {
    setDayMenus((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [type]: itemId },
    }));
  }, []);

  const total = selectedDays.reduce((sum, day) => {
    const menu = dayMenus[day] || {};
    return sum + Object.values(menu).reduce((s, id) => {
      if (!id) return s;
      const allItems = [...MENU_ITEMS.entree, ...MENU_ITEMS.plat, ...MENU_ITEMS.dessert, ...MENU_ITEMS.boisson];
      const item = allItems.find((i) => i.id === id);
      return s + (item?.price || 0);
    }, 0);
  }, 0);

  const mealCount = selectedDays.filter((d) => {
    const m = dayMenus[d];
    return m && Object.values(m).some(Boolean);
  }).length;

  const isFormComplete = form.first_name && form.last_name && form.stand && form.phone && form.email;
  const hasSelections = mealCount > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.blancCasse,
        fontFamily: "Questrial, sans-serif",
        paddingBottom: 100,
      }}
    >
      {/* HEADER */}
      <header
        style={{
          textAlign: "center",
          padding: "40px 24px 24px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: "white",
        }}
      >
        {/* Floral symbol placeholder */}
        <div style={{ marginBottom: 12, opacity: 0.8 }}>
          <svg width="36" height="36" viewBox="0 0 485 472" fill="none" style={{ display: "inline-block" }}>
            <circle cx="242" cy="200" r="12" fill={COLORS.rose} opacity="0.3" />
            <path d="M242 150 C242 150, 260 170, 260 190 C260 200, 252 208, 242 208 C232 208, 224 200, 224 190 C224 170, 242 150, 242 150Z" fill={COLORS.rose} opacity="0.6" />
            <path d="M242 150 C242 150, 224 170, 224 190 C224 200, 232 208, 242 208 C252 208, 260 200, 260 190 C260 170, 242 150, 242 150Z" fill={COLORS.rose} opacity="0.4" transform="rotate(60 242 190)" />
            <path d="M242 150 C242 150, 224 170, 224 190 C224 200, 232 208, 242 208 C252 208, 260 200, 260 190 C260 170, 242 150, 242 150Z" fill={COLORS.rose} opacity="0.4" transform="rotate(-60 242 190)" />
            <line x1="242" y1="208" x2="242" y2="250" stroke={COLORS.rose} strokeWidth="2" opacity="0.5" />
            <path d="M242 220 C250 215, 260 218, 260 218" stroke={COLORS.rose} strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M242 230 C234 225, 224 228, 224 228" stroke={COLORS.rose} strokeWidth="1.5" fill="none" opacity="0.4" />
          </svg>
        </div>
        <p
          style={{
            fontFamily: "Questrial, sans-serif",
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: COLORS.vieuxRose,
            marginBottom: 4,
          }}
        >
          Maison
        </p>
        <h1
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 38,
            fontWeight: 400,
            fontStyle: "italic",
            color: COLORS.rose,
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}
        >
          Félicien
        </h1>
        <p
          style={{
            fontFamily: "Questrial, sans-serif",
            fontSize: 13,
            color: "#9A8A7C",
            letterSpacing: "0.05em",
          }}
        >
          {EVENT.name} · 16 – 20 mars 2026
        </p>
      </header>

      {/* STEPS */}
      <div style={{ padding: "24px 24px 16px", maxWidth: 520, margin: "0 auto" }}>
        <StepIndicator
          current={step}
          labels={["Infos", "Jours", "Menus", "Paiement"]}
        />
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>
        {/* STEP 0: CLIENT INFO */}
        {step === 0 && (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "28px 24px",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <h2
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: 22,
                fontWeight: 400,
                fontStyle: "italic",
                color: COLORS.rose,
                marginBottom: 24,
              }}
            >
              Vos coordonnées
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MFInput label="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Jean" />
                <MFInput label="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Dupont" />
              </div>
              <MFInput label="Numéro de stand" value={form.stand} onChange={(e) => setForm({ ...form, stand: e.target.value })} placeholder="A-42" />
              <MFInput label="Téléphone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" />
              <MFInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jean@entreprise.com" />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!isFormComplete}
              style={{
                width: "100%",
                fontFamily: "Questrial, sans-serif",
                fontSize: 13,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "14px 0",
                borderRadius: 50,
                border: "none",
                background: isFormComplete ? COLORS.rose : COLORS.border,
                color: isFormComplete ? COLORS.blancCasse : "#B8A99A",
                cursor: isFormComplete ? "pointer" : "default",
                marginTop: 24,
                transition: "all 0.3s ease",
                fontWeight: 500,
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* STEP 1: SELECT DAYS */}
        {step === 1 && (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "28px 24px",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <h2
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: 22,
                fontWeight: 400,
                fontStyle: "italic",
                color: COLORS.rose,
                marginBottom: 8,
              }}
            >
              Vos jours de repas
            </h2>
            <p style={{ fontSize: 13, color: "#9A8A7C", marginBottom: 20, lineHeight: 1.5 }}>
              Sélectionnez les jours où vous souhaitez commander un repas.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {DAYS.map((day, i) => (
                <DayChip
                  key={day}
                  dayName={DAY_NAMES[i]}
                  date={DAY_DATES[i]}
                  selected={selectedDays.includes(day)}
                  onClick={() => toggleDay(day)}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  flex: 1,
                  fontFamily: "Questrial, sans-serif",
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "14px 0",
                  borderRadius: 50,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "white",
                  color: COLORS.marronGlace,
                  cursor: "pointer",
                }}
              >
                ← Retour
              </button>
              <button
                onClick={() => { setStep(2); setExpandedDay(selectedDays[0]); }}
                disabled={selectedDays.length === 0}
                style={{
                  flex: 2,
                  fontFamily: "Questrial, sans-serif",
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "14px 0",
                  borderRadius: 50,
                  border: "none",
                  background: selectedDays.length > 0 ? COLORS.rose : COLORS.border,
                  color: selectedDays.length > 0 ? COLORS.blancCasse : "#B8A99A",
                  cursor: selectedDays.length > 0 ? "pointer" : "default",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                }}
              >
                Choisir les menus →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MENU SELECTION */}
        {step === 2 && (
          <div>
            {/* Day tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
              {selectedDays.map((day, i) => {
                const idx = DAYS.indexOf(day);
                const isActive = expandedDay === day;
                const hasMenu = dayMenus[day] && Object.values(dayMenus[day]).some(Boolean);
                return (
                  <button
                    key={day}
                    onClick={() => setExpandedDay(day)}
                    style={{
                      fontFamily: "Questrial, sans-serif",
                      fontSize: 12,
                      padding: "8px 16px",
                      borderRadius: 50,
                      border: `1.5px solid ${isActive ? COLORS.rose : hasMenu ? COLORS.poudre : COLORS.border}`,
                      background: isActive ? COLORS.rose : hasMenu ? `${COLORS.poudre}44` : "white",
                      color: isActive ? COLORS.blancCasse : COLORS.marronGlace,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.3s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {hasMenu && !isActive && <span style={{ color: COLORS.vertOlive }}>✓</span>}
                    {DAY_NAMES[idx]} {DAY_DATES[idx]}
                  </button>
                );
              })}
            </div>

            {expandedDay && (
              <div
                style={{
                  background: "white",
                  borderRadius: 20,
                  padding: "24px 20px",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                {/* Day header with slot toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: 20,
                      fontWeight: 400,
                      fontStyle: "italic",
                      color: COLORS.rose,
                      margin: 0,
                    }}
                  >
                    {DAY_NAMES[DAYS.indexOf(expandedDay)]} {DAY_DATES[DAYS.indexOf(expandedDay)]}
                  </h2>
                  <SlotToggle
                    value={daySlots[expandedDay] || "midi"}
                    onChange={(slot) => setDaySlots((s) => ({ ...s, [expandedDay]: slot }))}
                  />
                </div>

                {/* Menu categories */}
                <MenuSection
                  title="Entrées"
                  type="entree"
                  items={MENU_ITEMS.entree}
                  selectedId={dayMenus[expandedDay]?.entree}
                  onSelect={(id) => setMenuChoice(expandedDay, "entree", id)}
                />
                <MenuSection
                  title="Plats"
                  type="plat"
                  items={MENU_ITEMS.plat}
                  selectedId={dayMenus[expandedDay]?.plat}
                  onSelect={(id) => setMenuChoice(expandedDay, "plat", id)}
                />
                <MenuSection
                  title="Desserts"
                  type="dessert"
                  items={MENU_ITEMS.dessert}
                  selectedId={dayMenus[expandedDay]?.dessert}
                  onSelect={(id) => setMenuChoice(expandedDay, "dessert", id)}
                />
                <MenuSection
                  title="Boissons"
                  type="boisson"
                  items={MENU_ITEMS.boisson}
                  selectedId={dayMenus[expandedDay]?.boisson}
                  onSelect={(id) => setMenuChoice(expandedDay, "boisson", id)}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  fontFamily: "Questrial, sans-serif",
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "14px 0",
                  borderRadius: 50,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "white",
                  color: COLORS.marronGlace,
                  cursor: "pointer",
                }}
              >
                ← Jours
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky total footer */}
      {step === 2 && (
        <StickyFooter
          total={total}
          itemCount={mealCount}
          canSubmit={hasSelections}
          onSubmit={() => alert(`Commande de ${total.toFixed(2)}€ pour ${form.first_name} ${form.last_name} — Stand ${form.stand}`)}
        />
      )}

      {/* Subtle decoration */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { background: ${COLORS.blancCasse}; }
        input::placeholder { color: #C4B5A8; }
        button:hover { opacity: 0.92; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.poudre}; border-radius: 4px; }
      `}</style>
    </div>
  );
}
