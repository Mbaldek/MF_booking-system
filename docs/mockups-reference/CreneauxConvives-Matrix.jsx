import { useState, useMemo } from "react";

/*
 * STEP 2 — CRÉNEAUX & CONVIVES — Matrix Approach
 *
 * Flow:
 * 1. Add convive names ONCE (simple list + input)
 * 2. Select which slots are active (pill toggles)
 * 3. Matrix: convives × slots checkboxes
 *    - "Tout cocher" = 1 tap, everyone everywhere
 *    - Per-row "tous les créneaux" for 1 convive
 *    - Per-column "tout le monde" for 1 slot  
 *    - Uncheck exceptions individually
 *
 * Mobile: cards with slot chips per convive (same logic, different layout)
 */

const C = {
  rose: "#8B3A43", vr: "#BF646D", poudre: "#E5B7B3", olive: "#968A42",
  cream: "#F0F0E6", dark: "#392D31", white: "#FDFAF7", border: "#E5D9D0",
  muted: "#9A8A7C", green: "#4A7C59", orange: "#C4793A",
};
const sans = (sz, opts = {}) => ({
  fontFamily: "'Questrial', sans-serif", fontSize: sz, fontWeight: opts.bold ? 600 : 400,
  color: opts.color || C.dark, letterSpacing: opts.tracking || 0,
  textTransform: opts.upper ? "uppercase" : "none",
});
const serif = (sz, opts = {}) => ({
  fontFamily: "'Georgia', serif", fontSize: sz, fontWeight: 400,
  fontStyle: "italic", color: opts.color || C.rose,
});

const SLOTS = [
  { key: "s1", label: "Sam. 28", sub: "Midi", icon: "☀", price: 24 },
  { key: "s2", label: "Dim. 1", sub: "Midi", icon: "☀", price: 24 },
  { key: "s3", label: "Dim. 1", sub: "Soir", icon: "☽", price: 28 },
  { key: "s4", label: "Lun. 2", sub: "Midi", icon: "☀", price: 24 },
  { key: "s5", label: "Lun. 2", sub: "Soir", icon: "☽", price: 28 },
];

function Checkbox({ checked, onChange, size = 22 }) {
  return (
    <button onClick={onChange} style={{
      width: size, height: size, borderRadius: 6, flexShrink: 0,
      border: `2px solid ${checked ? C.rose : C.border}`,
      background: checked ? C.rose : "white",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s",
    }}>
      {checked && <span style={{ color: "white", fontSize: size * 0.55, lineHeight: 1 }}>✓</span>}
    </button>
  );
}

function CTA({ children, onClick, disabled, variant = "primary", style: s }) {
  const bg = disabled ? C.border : variant === "primary" ? C.rose : variant === "green" ? C.green : "white";
  const clr = disabled ? C.muted : (variant === "primary" || variant === "green") ? C.cream : C.dark;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "14px 0", borderRadius: 50,
      border: variant === "outline" ? `1.5px solid ${C.border}` : "none",
      background: bg, cursor: disabled ? "default" : "pointer", minHeight: 50,
      ...sans(13, { upper: true, tracking: "0.1em", color: clr, bold: true }),
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...s,
    }}>{children}</button>
  );
}

export default function CreneauxConvivesMatrix() {
  const [convives, setConvives] = useState(["Mathieu", "Sophie"]);
  const [newName, setNewName] = useState("");
  // matrix[conviveName][slotKey] = true/false
  const [matrix, setMatrix] = useState({});
  const [editingIdx, setEditingIdx] = useState(null);

  const addConvive = (name) => {
    const n = name.trim();
    if (n && !convives.includes(n)) {
      setConvives([...convives, n]);
      setNewName("");
    }
  };

  const removeConvive = (name) => {
    setConvives(convives.filter((c) => c !== name));
    setMatrix((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const isChecked = (conv, slot) => !!(matrix[conv] && matrix[conv][slot]);

  const toggle = (conv, slot) => {
    setMatrix((prev) => ({
      ...prev,
      [conv]: { ...(prev[conv] || {}), [slot]: !isChecked(conv, slot) },
    }));
  };

  // Bulk actions
  const selectAll = () => {
    const m = {};
    convives.forEach((c) => {
      m[c] = {};
      SLOTS.forEach((s) => { m[c][s.key] = true; });
    });
    setMatrix(m);
  };

  const clearAll = () => setMatrix({});

  const isAllSelected = convives.length > 0 && convives.every((c) => SLOTS.every((s) => isChecked(c, s.key)));
  const isNoneSelected = convives.every((c) => SLOTS.every((s) => !isChecked(c, s.key)));

  const toggleRow = (conv) => {
    const allChecked = SLOTS.every((s) => isChecked(conv, s.key));
    setMatrix((prev) => ({
      ...prev,
      [conv]: Object.fromEntries(SLOTS.map((s) => [s.key, !allChecked])),
    }));
  };

  const toggleCol = (slotKey) => {
    const allChecked = convives.every((c) => isChecked(c, slotKey));
    setMatrix((prev) => {
      const m = { ...prev };
      convives.forEach((c) => { m[c] = { ...(m[c] || {}), [slotKey]: !allChecked }; });
      return m;
    });
  };

  const isRowAll = (conv) => SLOTS.every((s) => isChecked(conv, s.key));
  const isRowNone = (conv) => SLOTS.every((s) => !isChecked(conv, s.key));
  const isColAll = (slotKey) => convives.length > 0 && convives.every((c) => isChecked(c, slotKey));

  // Stats
  const totalMeals = convives.reduce((sum, c) => sum + SLOTS.filter((s) => isChecked(c, s.key)).length, 0);
  const totalPrice = convives.reduce((sum, c) => sum + SLOTS.filter((s) => isChecked(c, s.key)).reduce((ss, s) => ss + s.price, 0), 0);
  const activeSlotKeys = SLOTS.filter((s) => convives.some((c) => isChecked(c, s.key))).map((s) => s.key);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, paddingBottom: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; } body { background: ${C.cream}; }
        input::placeholder { color: ${C.muted}; }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: "center", padding: "18px 16px 12px", background: "white" }}>
        <div style={{ fontSize: 16, color: C.rose, opacity: 0.4 }}>❋</div>
        <p style={sans(9, { upper: true, tracking: "0.3em", color: C.vr })}>Maison</p>
        <h1 style={{ ...serif(26, { color: C.rose }), margin: 0 }}>Félicien</h1>
      </header>

      {/* Step bar */}
      <div style={{ display: "flex", justifyContent: "center", gap: 32, padding: "12px 16px", background: "white", borderBottom: `1px solid ${C.border}` }}>
        {["Infos", "Créneaux", "Menus", "Récap"].map((l, i) => (
          <span key={l} style={sans(11, { upper: true, tracking: "0.08em", color: i === 1 ? C.rose : C.muted, bold: i === 1 })}>{l}</span>
        ))}
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "16px" }}>

        {/* ═══ SECTION 1 — ADD CONVIVES ═══ */}
        <div style={{ background: "white", borderRadius: 20, border: `1px solid ${C.border}`, padding: "20px 18px", marginBottom: 12 }}>
          <h2 style={{ ...serif(20, { color: C.rose }), marginBottom: 4 }}>Qui mange ?</h2>
          <p style={{ ...sans(12, { color: C.muted }), marginBottom: 14 }}>Ajoutez les prénoms de chaque convive, une seule fois.</p>

          {/* Convive chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {convives.map((name, i) => (
              <div key={name} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 8px 7px 10px", borderRadius: 50,
                background: `${C.poudre}28`, border: `1px solid ${C.poudre}`,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", background: C.rose,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...sans(12, { color: C.cream, bold: true }),
                }}>{name[0]}</div>
                <span style={sans(14, { color: C.dark })}>{name}</span>
                <button onClick={() => removeConvive(name)} style={{
                  width: 22, height: 22, borderRadius: "50%", border: "none",
                  background: `${C.rose}12`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...sans(13, { color: C.rose }),
                }}>×</button>
              </div>
            ))}
          </div>

          {/* Add input */}
          {convives.length < 6 && (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addConvive(newName)}
                placeholder="Prénom du convive"
                style={{ ...sans(14), flex: 1, padding: "10px 16px", borderRadius: 50, border: `1.5px solid ${C.border}`, outline: "none" }} />
              <button onClick={() => addConvive(newName)} disabled={!newName.trim()} style={{
                width: 44, height: 44, borderRadius: "50%", border: "none",
                background: newName.trim() ? C.rose : C.border, cursor: newName.trim() ? "pointer" : "default",
                ...sans(20, { color: newName.trim() ? C.cream : C.muted }),
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>+</button>
            </div>
          )}
          {convives.length >= 6 && (
            <div style={sans(11, { color: C.muted })}>Maximum 6 convives atteint</div>
          )}
        </div>

        {/* ═══ SECTION 2 — MATRIX ═══ */}
        {convives.length > 0 && (
          <div style={{ background: "white", borderRadius: 20, border: `1px solid ${C.border}`, padding: "20px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h2 style={{ ...serif(20, { color: C.rose }), margin: "0 0 2px" }}>Qui mange quand ?</h2>
                <p style={sans(12, { color: C.muted })}>Cochez les créneaux pour chaque convive.</p>
              </div>
              {/* Bulk action */}
              <button onClick={isAllSelected ? clearAll : selectAll} style={{
                ...sans(10, { upper: true, tracking: "0.06em", color: isAllSelected ? C.vr : C.olive, bold: true }),
                padding: "6px 14px", borderRadius: 50,
                background: isAllSelected ? `${C.vr}10` : `${C.olive}10`,
                border: "none", cursor: "pointer",
              }}>
                {isAllSelected ? "✕ Tout décocher" : "⚡ Tout cocher"}
              </button>
            </div>

            {/* ═══ MATRIX TABLE ═══ */}
            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                {/* Column headers = slots */}
                <thead>
                  <tr>
                    <th style={{ padding: "0 8px 10px 0", textAlign: "left", position: "sticky", left: 0, background: "white", zIndex: 1, minWidth: 90 }} />
                    {SLOTS.map((s) => (
                      <th key={s.key} style={{ padding: "0 4px 10px", textAlign: "center", minWidth: 62 }}>
                        <button onClick={() => toggleCol(s.key)} style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                          background: "none", border: "none", cursor: "pointer", width: "100%",
                        }}>
                          <span style={{ fontSize: 14 }}>{s.icon}</span>
                          <span style={sans(10, { color: C.dark, bold: true })}>{s.label}</span>
                          <span style={sans(9, { color: C.muted })}>{s.sub}</span>
                          {/* Select all indicator */}
                          <div style={{
                            width: 14, height: 14, borderRadius: 4, marginTop: 3,
                            border: `1.5px solid ${isColAll(s.key) ? C.rose : C.border}`,
                            background: isColAll(s.key) ? C.rose : "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {isColAll(s.key) && <span style={{ color: "white", fontSize: 8 }}>✓</span>}
                          </div>
                        </button>
                      </th>
                    ))}
                    <th style={{ padding: "0 0 10px 8px", minWidth: 50 }} />
                  </tr>
                </thead>

                <tbody>
                  {convives.map((name) => (
                    <tr key={name}>
                      {/* Row label = convive name */}
                      <td style={{
                        padding: "8px 8px 8px 0", position: "sticky", left: 0,
                        background: "white", zIndex: 1,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: isRowAll(name) ? C.rose : isRowNone(name) ? `${C.poudre}30` : `${C.poudre}50`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            ...sans(12, { color: isRowAll(name) ? C.cream : C.dark, bold: true }),
                            transition: "all 0.2s",
                          }}>{name[0]}</div>
                          <span style={sans(13, { color: C.dark })}>{name}</span>
                        </div>
                      </td>

                      {/* Checkboxes */}
                      {SLOTS.map((s) => (
                        <td key={s.key} style={{ padding: "8px 4px", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <Checkbox
                              checked={isChecked(name, s.key)}
                              onChange={() => toggle(name, s.key)}
                              size={28}
                            />
                          </div>
                        </td>
                      ))}

                      {/* Row select all */}
                      <td style={{ padding: "8px 0 8px 8px" }}>
                        <button onClick={() => toggleRow(name)} style={{
                          ...sans(9, { upper: true, color: isRowAll(name) ? C.rose : C.muted }),
                          background: "none", border: "none", cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}>
                          {isRowAll(name) ? "aucun" : "tous"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ═══ MOBILE ALTERNATIVE — Cards view ═══ */}
            {/* Shows below 480px via CSS, but both are rendered for this mockup */}

            {/* ═══ PRICE GRID ═══ */}
            <div style={{ padding: "14px", borderRadius: 14, background: C.cream }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={sans(12, { color: C.muted })}>Créneaux actifs</span>
                <span style={sans(12, { color: C.dark, bold: true })}>{activeSlotKeys.length} / {SLOTS.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={sans(12, { color: C.muted })}>Total repas</span>
                <span style={sans(12, { color: C.dark, bold: true })}>{totalMeals}</span>
              </div>

              {/* Per-slot breakdown */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 6 }}>
                {SLOTS.filter((s) => convives.some((c) => isChecked(c, s.key))).map((s) => {
                  const count = convives.filter((c) => isChecked(c, s.key)).length;
                  return (
                    <div key={s.key} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={sans(11, { color: C.muted })}>{s.icon} {s.label} {s.sub} · {count} conv.</span>
                      <span style={sans(11, { color: C.dark })}>{count * s.price}€</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={sans(13, { color: C.rose, bold: true })}>Estimation</span>
                <span style={serif(20, { color: C.rose })}>{totalPrice} €</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MOBILE CARD VIEW (alternative below matrix) ═══ */}
        {convives.length > 0 && (
          <div style={{ background: "white", borderRadius: 20, border: `1px solid ${C.border}`, padding: "20px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ ...serif(18, { color: C.rose }), margin: 0 }}>Vue mobile</h3>
              <button onClick={isAllSelected ? clearAll : selectAll} style={{
                ...sans(10, { upper: true, tracking: "0.06em", color: C.olive, bold: true }),
                padding: "5px 12px", borderRadius: 50, background: `${C.olive}10`, border: "none", cursor: "pointer",
              }}>{isAllSelected ? "Décocher" : "⚡ Tous partout"}</button>
            </div>

            {convives.map((name) => (
              <div key={name} style={{
                padding: "12px 14px", borderRadius: 14, marginBottom: 8,
                border: `1px solid ${isRowAll(name) ? `${C.green}25` : C.border}`,
                background: isRowAll(name) ? `${C.green}04` : "white",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: isRowAll(name) ? C.rose : `${C.poudre}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      ...sans(13, { color: isRowAll(name) ? C.cream : C.dark, bold: true }),
                    }}>{name[0]}</div>
                    <span style={sans(15, { color: C.dark, bold: true })}>{name}</span>
                  </div>
                  <button onClick={() => toggleRow(name)} style={{
                    ...sans(10, { upper: true, tracking: "0.06em", color: isRowAll(name) ? C.vr : C.olive }),
                    padding: "4px 10px", borderRadius: 50,
                    background: isRowAll(name) ? `${C.vr}10` : `${C.olive}10`,
                    border: "none", cursor: "pointer",
                  }}>
                    {isRowAll(name) ? "Décocher tout" : "⚡ Tous les créneaux"}
                  </button>
                </div>

                {/* Slot pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {SLOTS.map((s) => {
                    const checked = isChecked(name, s.key);
                    return (
                      <button key={s.key} onClick={() => toggle(name, s.key)} style={{
                        padding: "7px 12px", borderRadius: 50,
                        border: `1.5px solid ${checked ? C.rose : C.border}`,
                        background: checked ? `${C.poudre}22` : "white",
                        cursor: "pointer", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 5,
                        ...sans(11, { color: checked ? C.rose : C.muted }),
                      }}>
                        {checked && <span style={{ fontSize: 10 }}>✓</span>}
                        {s.icon} {s.label} {s.sub}
                      </button>
                    );
                  })}
                </div>

                {/* Convive slot count */}
                <div style={{ marginTop: 6, ...sans(11, { color: C.muted }) }}>
                  {SLOTS.filter((s) => isChecked(name, s.key)).length} créneau{SLOTS.filter((s) => isChecked(name, s.key)).length > 1 ? "x" : ""}
                  {SLOTS.filter((s) => isChecked(name, s.key)).length > 0 && (
                    <span style={{ color: C.olive }}> · {SLOTS.filter((s) => isChecked(name, s.key)).reduce((sum, s) => sum + s.price, 0)}€</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", gap: 8 }}>
          <CTA variant="outline" style={{ flex: 1 }}>← Infos</CTA>
          <CTA disabled={totalMeals === 0} style={{ flex: 2 }}>
            {totalMeals > 0 ? `Choisir les menus (${totalMeals} repas) →` : "Sélectionnez au moins 1 créneau"}
          </CTA>
        </div>
      </div>

      {/* Sticky footer */}
      {totalMeals > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white", borderTop: `1px solid ${C.border}`,
          padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 -3px 16px rgba(57,45,49,0.05)", zIndex: 100,
        }}>
          <div>
            <div style={sans(10, { upper: true, tracking: "0.06em", color: C.muted })}>
              {convives.length} convive{convives.length > 1 ? "s" : ""} · {totalMeals} repas
            </div>
            <div style={serif(20, { color: C.rose })}>{totalPrice} €</div>
          </div>
          <button disabled={totalMeals === 0} style={{
            ...sans(11, { upper: true, tracking: "0.1em", color: C.cream, bold: true }),
            padding: "11px 20px", borderRadius: 50, background: totalMeals > 0 ? C.rose : C.border,
            border: "none", cursor: totalMeals > 0 ? "pointer" : "default",
          }}>Menus →</button>
        </div>
      )}
    </div>
  );
}
