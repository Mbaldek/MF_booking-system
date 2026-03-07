import { useState, useCallback } from "react";

/*
 * ORDER STEP 2 — MENU SELECTION — v2
 *
 * Améliorations v2 :
 * 1. COLLAPSE/EXPAND par catégorie — une fois renseignée, la catégorie se replie
 *    pour montrer juste le choix sélectionné. Réduit la surcharge visuelle.
 *    Tap pour ré-ouvrir et modifier.
 *
 * 2. AUTO-FILL en MODAL BLUR CENTRÉ — plus impactant qu'un bottom sheet,
 *    crée un vrai moment de décision. Le backdrop blur donne un effet premium
 *    cohérent avec l'univers MF.
 *
 * 3. Funnel linéaire conservé (v1) — bouton "Valider et passer au suivant"
 */

const C = {
  rose: "#8B3A43", vr: "#BF646D", poudre: "#E5B7B3", olive: "#968A42",
  cream: "#F0F0E6", dark: "#392D31", white: "#FDFAF7", border: "#E5D9D0",
  muted: "#9A8A7C", green: "#4A7C59", orange: "#C4793A",
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

const SLOTS = [
  { key: "2026-02-28-midi", day: "sam. 28 févr.", slot: "Midi", price: 24 },
  { key: "2026-03-01-midi", day: "dim. 1 mars", slot: "Midi", price: 24 },
  { key: "2026-03-01-soir", day: "dim. 1 mars", slot: "Soir", price: 28 },
  { key: "2026-03-02-midi", day: "lun. 2 mars", slot: "Midi", price: 24 },
  { key: "2026-03-02-soir", day: "lun. 2 mars", slot: "Soir", price: 28 },
];

const MENU = {
  entree: [
    { id: 1, name: "Terrine de campagne", desc: "Cornichons et pain de campagne" },
    { id: 2, name: "Salade César", desc: "Romaine, parmesan, croûtons, sauce César" },
    { id: 3, name: "Velouté de butternut", desc: "Noisettes torréfiées, crème d'estragon" },
  ],
  plat: [
    { id: 4, name: "Filet de saumon grillé", desc: "Riz basmati, sauce à l'aneth" },
    { id: 5, name: "Suprême de volaille", desc: "Jus corsé, purée truffée" },
    { id: 6, name: "Risotto aux cèpes", desc: "Parmesan 24 mois, roquette" },
  ],
  dessert: [
    { id: 7, name: "Salade de fruits frais", desc: "Fruits de saison, menthe fraîche" },
    { id: 8, name: "Fondant au chocolat", desc: "Cœur coulant, glace vanille" },
    { id: 9, name: "Crème brûlée vanille", desc: "Gousse de Madagascar" },
  ],
  boisson: [
    { id: 10, name: "Café espresso", desc: "" },
    { id: 11, name: "Thé vert bio", desc: "" },
    { id: 12, name: "Jus de fruits frais", desc: "Orange, pomme ou pamplemousse" },
  ],
};

const ALL_ITEMS = Object.values(MENU).flat();
const CATS = [
  { key: "entree", label: "Entrée", emoji: "🥗" },
  { key: "plat", label: "Plat", emoji: "🍽" },
  { key: "dessert", label: "Dessert", emoji: "🍰" },
  { key: "boisson", label: "Boisson", emoji: "🥤" },
];

/* ═══ MENU ITEM ═══ */
function MenuItem({ item, selected, onSelect }) {
  return (
    <button onClick={() => onSelect(item.id)} style={{
      width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12,
      border: `1.5px solid ${selected ? C.rose : C.border}`,
      background: selected ? `${C.poudre}25` : "white",
      cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10,
      marginBottom: 6,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? C.rose : C.border}`,
        background: selected ? C.rose : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
      </div>
      <div>
        <div style={sans(14, { color: selected ? C.rose : C.dark, bold: selected })}>{item.name}</div>
        {item.desc && <div style={sans(12, { color: C.muted })}>{item.desc}</div>}
      </div>
    </button>
  );
}

/* ═══ COLLAPSIBLE CATEGORY ═══ */
function CategorySection({ cat, selectedId, onSelect, forceOpen }) {
  const selectedItem = selectedId ? ALL_ITEMS.find((i) => i.id === selectedId) : null;
  const isFilled = !!selectedItem;
  const [manualOpen, setManualOpen] = useState(false);

  // Open if: not filled, or forced open, or manually opened
  const isOpen = !isFilled || forceOpen || manualOpen;

  return (
    <div style={{
      marginBottom: 12, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${isFilled && !isOpen ? `${C.green}25` : C.border}`,
      background: isFilled && !isOpen ? `${C.green}04` : "transparent",
      transition: "all 0.3s",
    }}>
      {/* Category header — always visible, tappable */}
      <button
        onClick={() => isFilled && setManualOpen(!manualOpen)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", background: "none", border: "none", cursor: isFilled ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{cat.emoji}</span>
          <span style={sans(10, { upper: true, tracking: "0.14em", color: C.rose, bold: true })}>
            {cat.label}
          </span>
          <span style={sans(10, { color: C.muted })}>obligatoire</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isFilled && !isOpen && (
            <span style={sans(10, { color: C.green })}>✓</span>
          )}
          {isFilled && (
            <span style={{
              fontSize: 12, color: C.muted, transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            }}>▾</span>
          )}
        </div>
      </button>

      {/* Collapsed state — show selected item as compact summary */}
      {isFilled && !isOpen && (
        <div style={{
          padding: "0 14px 12px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", background: C.rose, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: 10 }}>✓</span>
          </div>
          <span style={sans(14, { color: C.dark, bold: true })}>{selectedItem.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setManualOpen(true); }}
            style={{
              marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
              ...sans(11, { color: C.vr }),
            }}
          >
            modifier
          </button>
        </div>
      )}

      {/* Expanded state — full item list */}
      <div style={{
        maxHeight: isOpen ? 500 : 0, overflow: "hidden",
        transition: "max-height 0.35s ease",
        padding: isOpen ? "0 14px 12px" : "0 14px",
      }}>
        {MENU[cat.key].map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={(id) => {
              onSelect(id);
              // Auto-collapse after selection (small delay for visual feedback)
              setTimeout(() => setManualOpen(false), 300);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══ AUTO-FILL MODAL — Blur centered ═══ */
function AutoFillModal({ onAccept, onDecline, firstSlotLabel, slotsCount }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      {/* Backdrop blur */}
      <div
        onClick={onDecline}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(57, 45, 49, 0.35)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "fadeIn 0.3s ease",
        }}
      />

      {/* Modal card */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "white", borderRadius: 24, padding: "32px 24px 24px",
        maxWidth: 380, width: "100%",
        boxShadow: "0 24px 80px rgba(57,45,49,0.18)",
        animation: "modalIn 0.4s ease both",
      }}>
        {/* Decorative icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px",
          background: `linear-gradient(135deg, ${C.olive}20, ${C.poudre}40)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>
          ⚡
        </div>

        <h3 style={{ ...serif(24, { color: C.rose }), textAlign: "center", margin: "0 0 8px" }}>
          Gagner du temps ?
        </h3>

        <p style={{
          ...sans(14, { color: C.muted }),
          textAlign: "center", lineHeight: 1.6, margin: "0 0 8px",
        }}>
          Votre sélection du
        </p>

        {/* First slot recap */}
        <div style={{
          padding: "10px 14px", borderRadius: 12, background: C.cream,
          textAlign: "center", marginBottom: 12,
        }}>
          <span style={sans(14, { color: C.dark, bold: true })}>{firstSlotLabel}</span>
        </div>

        <p style={{
          ...sans(14, { color: C.muted }),
          textAlign: "center", lineHeight: 1.6, margin: "0 0 20px",
        }}>
          sera appliquée aux <strong style={{ color: C.dark }}>{slotsCount - 1} autres créneaux</strong>.
          <br />
          <span style={sans(12, { color: C.muted })}>
            Vous pourrez modifier chaque créneau individuellement.
          </span>
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={onAccept} style={{
            width: "100%", padding: "15px 0", borderRadius: 50,
            border: "none", background: C.rose, cursor: "pointer",
            ...sans(13, { upper: true, tracking: "0.1em", color: C.cream, bold: true }),
            minHeight: 50, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            ⚡ Appliquer à tous les créneaux
          </button>

          <button onClick={onDecline} style={{
            width: "100%", padding: "13px 0", borderRadius: 50,
            border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer",
            ...sans(12, { upper: true, tracking: "0.08em", color: C.muted }),
            minHeight: 46,
          }}>
            Non, je choisis pour chaque créneau
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function MenuStepV2() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState({});
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [autoFillDone, setAutoFillDone] = useState(false);

  const currentSlot = SLOTS[currentIndex];
  const currentSel = selections[currentSlot.key] || {};
  const isComplete = CATS.every((c) => currentSel[c.key]);
  const isLast = currentIndex === SLOTS.length - 1;

  const completedSlots = SLOTS.filter((s) => {
    const sel = selections[s.key] || {};
    return CATS.every((c) => sel[c.key]);
  }).length;

  const allComplete = completedSlots === SLOTS.length;

  const total = SLOTS.reduce((sum, s) => {
    const sel = selections[s.key] || {};
    return sum + (CATS.every((c) => sel[c.key]) ? s.price : 0);
  }, 0);

  const setChoice = (cat, itemId) => {
    setSelections((prev) => ({
      ...prev,
      [currentSlot.key]: {
        ...(prev[currentSlot.key] || {}),
        [cat]: currentSel[cat] === itemId ? null : itemId,
        _prefilled: false, // manual change removes prefilled flag
      },
    }));
  };

  const handleValidateSlot = () => {
    if (currentIndex === 0 && !autoFillDone && SLOTS.length > 1) {
      setShowAutoFill(true);
      return;
    }
    if (!isLast) setCurrentIndex((i) => i + 1);
  };

  const handleAutoFill = () => {
    const firstSel = selections[SLOTS[0].key];
    const newSelections = { ...selections };
    for (let i = 1; i < SLOTS.length; i++) {
      newSelections[SLOTS[i].key] = { ...firstSel, _prefilled: true };
    }
    setSelections(newSelections);
    setAutoFillDone(true);
    setShowAutoFill(false);
    setCurrentIndex(1);
  };

  const handleDeclineAutoFill = () => {
    setAutoFillDone(true);
    setShowAutoFill(false);
    setCurrentIndex(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, paddingBottom: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { background: ${C.cream}; }
        button:active { transform: scale(0.97); }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn { from { opacity:0; transform: scale(0.92) translateY(16px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
      `}</style>

      {/* Steps bar */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 32, padding: "14px 16px",
        background: "white", borderBottom: `1px solid ${C.border}`,
      }}>
        {["Infos", "Jours", "Menus", "Récap"].map((l, i) => (
          <span key={l} style={sans(11, { upper: true, tracking: "0.08em", color: i === 2 ? C.rose : C.muted, bold: i === 2 })}>{l}</span>
        ))}
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* ═══ SLOT TABS ═══ */}
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
          {SLOTS.map((s, i) => {
            const active = i === currentIndex;
            const sel = selections[s.key] || {};
            const complete = CATS.every((c) => sel[c.key]);
            return (
              <button key={s.key} onClick={() => setCurrentIndex(i)} style={{
                ...sans(12, { color: active ? C.cream : C.dark }),
                padding: "7px 14px", whiteSpace: "nowrap", borderRadius: 50,
                background: active ? C.rose : complete ? `${C.poudre}40` : "white",
                border: `1.5px solid ${active ? C.rose : complete ? C.poudre : C.border}`,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                {complete && !active && (
                  <span style={{ fontSize: 10, color: sel._prefilled ? C.olive : C.green }}>
                    {sel._prefilled ? "⚡" : "✓"}
                  </span>
                )}
                {s.day} {s.slot === "Soir" ? "☽" : ""}
              </button>
            );
          })}
        </div>

        {/* ═══ PROGRESS ═══ */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
          padding: "8px 14px", borderRadius: 10, background: "white", border: `1px solid ${C.border}`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={sans(11, { color: C.dark })}>
                Créneau <strong>{currentIndex + 1}</strong> / {SLOTS.length}
              </span>
              <span style={sans(11, { color: completedSlots === SLOTS.length ? C.green : C.rose, bold: true })}>
                {completedSlots}/{SLOTS.length} validés
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: C.cream }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: completedSlots === SLOTS.length ? C.green : C.rose,
                width: `${(completedSlots / SLOTS.length) * 100}%`,
                transition: "width 0.4s",
              }} />
            </div>
          </div>
        </div>

        {/* ═══ MENU CARD ═══ */}
        <div style={{
          background: "white", borderRadius: 20, border: `1px solid ${C.border}`,
          padding: "20px 16px", marginBottom: 12,
        }}>
          {/* Slot header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 6,
          }}>
            <h2 style={{ ...serif(20, { color: C.rose }), margin: 0 }}>
              {currentSlot.day} — {currentSlot.slot}
            </h2>
            <span style={{
              ...sans(13, { color: C.olive, bold: true }),
              padding: "4px 12px", borderRadius: 50, background: `${C.olive}12`,
            }}>{currentSlot.price}€</span>
          </div>

          {/* Prefilled banner */}
          {currentSel._prefilled && (
            <div style={{
              padding: "8px 12px", borderRadius: 10, marginBottom: 12,
              background: `${C.olive}08`, border: `1px solid ${C.olive}18`,
              display: "flex", alignItems: "center", gap: 8,
              ...sans(12, { color: C.olive }),
            }}>
              ⚡ Pré-rempli. Modifiez si besoin.
            </div>
          )}

          {/* Completion mini-summary when all filled */}
          {isComplete && (
            <div style={{
              display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12,
              padding: "8px 0", borderBottom: `1px solid ${C.cream}`,
            }}>
              {CATS.map((cat) => {
                const item = ALL_ITEMS.find((i) => i.id === currentSel[cat.key]);
                return item ? (
                  <span key={cat.key} style={{
                    ...sans(11, { color: C.dark }),
                    padding: "4px 10px", borderRadius: 50, background: `${C.green}08`,
                    border: `1px solid ${C.green}15`,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 12 }}>{cat.emoji}</span>
                    {item.name}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* ═══ COLLAPSIBLE CATEGORIES ═══ */}
          {CATS.map((cat) => (
            <CategorySection
              key={cat.key}
              cat={cat}
              selectedId={currentSel[cat.key]}
              onSelect={(id) => setChoice(cat.key, id)}
              forceOpen={false}
            />
          ))}

          {/* ═══ FORWARD BUTTON ═══ */}
          {!isLast ? (
            <button
              onClick={handleValidateSlot}
              disabled={!isComplete}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 50, marginTop: 8,
                border: "none", cursor: isComplete ? "pointer" : "default",
                background: isComplete ? C.rose : C.border,
                ...sans(13, { upper: true, tracking: "0.1em", color: isComplete ? C.cream : C.muted, bold: true }),
                minHeight: 50, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.3s",
                animation: isComplete ? "pulse 2.5s ease infinite" : "none",
              }}
            >
              {isComplete
                ? "Valider ma sélection →"
                : `Sélectionnez vos plats (${CATS.filter(c => currentSel[c.key]).length}/${CATS.length})`
              }
            </button>
          ) : (
            <button
              disabled={!allComplete}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 50, marginTop: 8,
                border: "none", cursor: allComplete ? "pointer" : "default",
                background: allComplete ? C.green : C.border,
                ...sans(13, { upper: true, tracking: "0.1em", color: allComplete ? "white" : C.muted, bold: true }),
                minHeight: 50,
              }}
            >
              {allComplete
                ? "Voir le récapitulatif →"
                : `${completedSlots}/${SLOTS.length} créneaux validés`
              }
            </button>
          )}
        </div>

        {/* Back nav */}
        <button
          onClick={() => currentIndex > 0 ? setCurrentIndex(i => i - 1) : null}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 50,
            border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer",
            ...sans(11, { upper: true, tracking: "0.08em", color: C.muted }),
          }}
        >
          {currentIndex > 0 ? "← Créneau précédent" : "‹ Modifier les jours"}
        </button>
      </div>

      {/* ═══ STICKY FOOTER ═══ */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: `1px solid ${C.border}`,
        padding: "10px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 -3px 16px rgba(57,45,49,0.05)", zIndex: 100,
      }}>
        <div>
          <div style={sans(10, { upper: true, tracking: "0.06em", color: C.muted })}>
            {completedSlots} créneau{completedSlots > 1 ? "x" : ""}
          </div>
          <div style={serif(20, { color: C.rose })}>{total.toFixed(2)} €</div>
        </div>
        {allComplete && (
          <button style={{
            ...sans(11, { upper: true, tracking: "0.1em", color: C.cream, bold: true }),
            padding: "11px 22px", borderRadius: 50, background: C.rose,
            border: "none", cursor: "pointer",
          }}>
            Récapitulatif →
          </button>
        )}
      </div>

      {/* ═══ AUTO-FILL MODAL — Blur centered ═══ */}
      {showAutoFill && (
        <AutoFillModal
          onAccept={handleAutoFill}
          onDecline={handleDeclineAutoFill}
          firstSlotLabel={`${SLOTS[0].day} — ${SLOTS[0].slot}`}
          slotsCount={SLOTS.length}
        />
      )}
    </div>
  );
}
