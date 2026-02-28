import { useState, useEffect, useRef } from "react";

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
};

// Botanical ornament SVG paths for decorative elements
const Ornament = ({ size = 120, color = C.poudre, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{ opacity: 0.35, ...style }}>
    <path d="M60 10 C60 10, 75 30, 75 50 C75 62, 68 70, 60 70 C52 70, 45 62, 45 50 C45 30, 60 10, 60 10Z" fill={color} />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill={color} transform="rotate(72 60 55)" />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill={color} transform="rotate(144 60 55)" />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill={color} transform="rotate(216 60 55)" />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill={color} transform="rotate(288 60 55)" />
    <circle cx="60" cy="55" r="8" fill={color} opacity="0.6" />
  </svg>
);

const Vine = ({ side = "left", color = C.poudre }) => (
  <svg width="60" height="300" viewBox="0 0 60 300" fill="none" style={{ opacity: 0.2, transform: side === "right" ? "scaleX(-1)" : "none" }}>
    <path d="M30 0 C30 60, 10 80, 10 120 C10 160, 50 180, 50 220 C50 260, 30 280, 30 300" stroke={color} strokeWidth="1.5" fill="none" />
    <ellipse cx="10" cy="120" rx="8" ry="12" fill={color} opacity="0.4" transform="rotate(-20 10 120)" />
    <ellipse cx="50" cy="220" rx="8" ry="12" fill={color} opacity="0.4" transform="rotate(20 50 220)" />
    <ellipse cx="18" cy="80" rx="6" ry="10" fill={color} opacity="0.3" transform="rotate(-30 18 80)" />
    <ellipse cx="42" cy="180" rx="6" ry="10" fill={color} opacity="0.3" transform="rotate(30 42 180)" />
    <circle cx="30" cy="150" r="3" fill={color} opacity="0.5" />
  </svg>
);

const FleuronDivider = ({ color = C.rose }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", margin: "32px 0" }}>
    <div style={{ width: 60, height: 1, background: C.border }} />
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 2 C10 2, 14 6, 14 10 C14 12.5, 12 14, 10 14 C8 14, 6 12.5, 6 10 C6 6, 10 2, 10 2Z" fill={color} opacity="0.6" />
      <path d="M10 2 C10 2, 6 6, 6 10 C6 12.5, 8 14, 10 14 C12 14, 14 12.5, 14 10 C14 6, 10 2, 10 2Z" fill={color} opacity="0.4" transform="rotate(90 10 10)" />
      <circle cx="10" cy="10" r="2" fill={color} opacity="0.8" />
    </svg>
    <div style={{ width: 60, height: 1, background: C.border }} />
  </div>
);

// Animated counter for menu items
function AnimNum({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return <span>{val}</span>;
}

// Sample upcoming event
const EVENT = {
  name: "Salon du Bâtiment",
  subtitle: "Paris Expo — Porte de Versailles",
  dates: "16 — 20 mars 2026",
  slots: "Midi & Soir",
  items: 13,
  remaining: 42,
};

const MENU_PREVIEW = [
  { cat: "Entrées", items: ["Velouté de butternut", "Tartare de saumon", "Salade de chèvre chaud"] },
  { cat: "Plats", items: ["Suprême de volaille", "Dos de cabillaud", "Risotto aux cèpes"] },
  { cat: "Desserts", items: ["Crème brûlée vanille", "Fondant au chocolat", "Panna cotta framboise"] },
];

export default function MainPage() {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { background: ${C.cream}; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.55; } }
        .fade-up { animation: fadeUp 0.8s ease both; }
        .fade-in { animation: fadeIn 1s ease both; }
        .float { animation: float 6s ease-in-out infinite; }
        .pulse-ornament { animation: pulse 4s ease-in-out infinite; }
        button:hover { opacity: 0.9; }
        button:active { transform: scale(0.97); }
        a { text-decoration: none; }
      `}</style>

      {/* ═══ NAV BAR ═══ */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 28px", background: "white", borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "Questrial, sans-serif", fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.rose, padding: "6px 0",
        }}>
          {menuOpen ? "Fermer" : "Menu"}
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Questrial, sans-serif", fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: C.vr, marginBottom: 1 }}>
            Maison
          </div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontStyle: "italic", color: C.rose, lineHeight: 1 }}>
            Félicien
          </div>
        </div>

        <div style={{
          fontFamily: "Questrial, sans-serif", fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.rose, cursor: "pointer", padding: "6px 0",
        }}>
          Commander
        </div>
      </nav>

      {/* Side menu overlay */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          display: "flex",
        }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(57,45,49,0.3)" }} />
          <div className="fade-up" style={{
            position: "relative", width: 320, background: "white", padding: "48px 36px",
            display: "flex", flexDirection: "column", gap: 28, zIndex: 1,
          }}>
            <button onClick={() => setMenuOpen(false)} style={{
              position: "absolute", top: 18, right: 20, background: "none", border: "none",
              fontFamily: "Questrial, sans-serif", fontSize: 11, letterSpacing: "0.14em",
              textTransform: "uppercase", color: C.rose, cursor: "pointer",
            }}>Fermer</button>
            {["Commander", "La Carte", "Nos Événements", "À Propos", "Contact"].map((item, i) => (
              <div key={item} className="fade-up" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                <span style={{
                  fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: "italic",
                  color: C.rose, cursor: "pointer", lineHeight: 1.3,
                  transition: "color 0.3s",
                }}>
                  {item}
                </span>
              </div>
            ))}
            <div style={{ marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "Questrial, sans-serif", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
                Traiteur événementiel
              </div>
              <div style={{ fontFamily: "Questrial, sans-serif", fontSize: 13, color: C.dark, lineHeight: 1.5 }}>
                Repas livrés sur stand,<br />salons & événements
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section style={{
        position: "relative", textAlign: "center",
        padding: "72px 24px 56px", overflow: "hidden", background: "white",
      }}>
        {/* Decorative botanical elements */}
        <div className="float pulse-ornament" style={{ position: "absolute", top: 20, left: -20 }}>
          <Ornament size={100} color={C.poudre} />
        </div>
        <div className="float pulse-ornament" style={{ position: "absolute", top: 40, right: -15, animationDelay: "2s" }}>
          <Ornament size={80} color={C.poudre} />
        </div>
        <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}>
          <Vine side="left" color={C.poudre} />
        </div>
        <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
          <Vine side="right" color={C.poudre} />
        </div>

        <div className={visible ? "fade-up" : ""} style={{ opacity: visible ? 1 : 0, position: "relative", zIndex: 1 }}>
          <div style={{
            fontFamily: "Questrial, sans-serif", fontSize: 10, letterSpacing: "0.3em",
            textTransform: "uppercase", color: C.olive, marginBottom: 16,
          }}>
            Traiteur événementiel
          </div>

          {/* Decorative fleuron above title */}
          <div style={{ marginBottom: 16, opacity: 0.6 }}>
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
              <path d="M20 4 C20 4, 28 14, 28 22 C28 27, 24 30, 20 30 C16 30, 12 27, 12 22 C12 14, 20 4, 20 4Z" fill={C.rose} opacity="0.7" />
              <path d="M20 4 C20 4, 12 14, 12 22 C12 27, 16 30, 20 30 C24 30, 28 27, 28 22 C28 14, 20 4, 20 4Z" fill={C.rose} opacity="0.5" transform="rotate(60 20 22)" />
              <path d="M20 4 C20 4, 12 14, 12 22 C12 27, 16 30, 20 30 C24 30, 28 27, 28 22 C28 14, 20 4, 20 4Z" fill={C.rose} opacity="0.5" transform="rotate(-60 20 22)" />
              <line x1="20" y1="30" x2="20" y2="46" stroke={C.rose} strokeWidth="1.5" opacity="0.4" />
              <path d="M20 36 C24 33, 30 34, 30 34" stroke={C.rose} strokeWidth="1" fill="none" opacity="0.3" />
              <path d="M20 40 C16 37, 10 38, 10 38" stroke={C.rose} strokeWidth="1" fill="none" opacity="0.3" />
            </svg>
          </div>

          <p style={{
            fontFamily: "Questrial, sans-serif", fontSize: 10, letterSpacing: "0.35em",
            textTransform: "uppercase", color: C.vr, marginBottom: 4,
          }}>
            Maison
          </p>
          <h1 style={{
            fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 56,
            fontWeight: 400, fontStyle: "italic", color: C.rose,
            margin: "0 0 16px", lineHeight: 1.05, letterSpacing: "-0.01em",
          }}>
            Félicien
          </h1>

          <p style={{
            fontFamily: "Questrial, sans-serif", fontSize: 15, color: C.muted,
            lineHeight: 1.7, maxWidth: 380, margin: "0 auto 28px",
          }}>
            Des repas d'exception livrés directement sur votre stand. 
            Commandez pour votre équipe, nous nous occupons du reste.
          </p>

          <button style={{
            fontFamily: "Questrial, sans-serif", fontSize: 12, letterSpacing: "0.14em",
            textTransform: "uppercase", padding: "15px 40px", borderRadius: 50,
            background: C.rose, color: C.cream, border: "none", cursor: "pointer",
            transition: "all 0.3s ease", fontWeight: 500,
          }}>
            Commander maintenant
          </button>
        </div>
      </section>

      {/* ═══ EVENT CARD ═══ */}
      <section style={{ padding: "0 20px", maxWidth: 520, margin: "0 auto" }}>
        <div className={visible ? "fade-up" : ""} style={{
          animationDelay: "0.3s", opacity: visible ? 1 : 0,
          marginTop: -24, position: "relative", zIndex: 2,
        }}>
          <div style={{
            background: "white", borderRadius: 24, border: `1px solid ${C.border}`,
            padding: "28px 24px", boxShadow: "0 8px 40px rgba(57,45,49,0.06)",
          }}>
            {/* Event badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{
                  fontFamily: "Questrial, sans-serif", fontSize: 9, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: C.olive, padding: "3px 10px",
                  borderRadius: 50, background: `${C.olive}15`, display: "inline-block", marginBottom: 8,
                }}>
                  Prochain événement
                </span>
                <h2 style={{
                  fontFamily: "'Georgia', serif", fontSize: 24, fontStyle: "italic",
                  fontWeight: 400, color: C.rose, margin: 0, lineHeight: 1.2,
                }}>
                  {EVENT.name}
                </h2>
                <p style={{
                  fontFamily: "Questrial, sans-serif", fontSize: 13, color: C.muted, marginTop: 4,
                }}>
                  {EVENT.subtitle}
                </p>
              </div>
              {/* Mini ornament */}
              <div style={{ marginTop: 4, opacity: 0.4 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4 C16 4, 21 10, 21 15 C21 18, 19 20, 16 20 C13 20, 11 18, 11 15 C11 10, 16 4, 16 4Z" fill={C.rose} />
                  <line x1="16" y1="20" x2="16" y2="28" stroke={C.rose} strokeWidth="1" />
                  <path d="M16 23 C18 21.5, 21 22, 21 22" stroke={C.rose} strokeWidth="0.8" fill="none" />
                  <path d="M16 25.5 C14 24, 11 24.5, 11 24.5" stroke={C.rose} strokeWidth="0.8" fill="none" />
                </svg>
              </div>
            </div>

            {/* Event details grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12, marginBottom: 20,
              padding: "16px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
            }}>
              {[
                { label: "Dates", value: EVENT.dates, icon: "◷" },
                { label: "Services", value: EVENT.slots, icon: "☀ ☽" },
                { label: "Plats", value: `${EVENT.items} choix`, icon: "❋" },
              ].map((d) => (
                <div key={d.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, marginBottom: 4, color: C.poudre }}>{d.icon}</div>
                  <div style={{
                    fontFamily: "Questrial, sans-serif", fontSize: 9, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: C.muted, marginBottom: 3,
                  }}>
                    {d.label}
                  </div>
                  <div style={{
                    fontFamily: "Questrial, sans-serif", fontSize: 13, fontWeight: 500, color: C.dark,
                  }}>
                    {d.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Remaining spots */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 14, background: `${C.poudre}18`, marginBottom: 18,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: C.olive,
                  boxShadow: `0 0 6px ${C.olive}60`,
                }} />
                <span style={{ fontFamily: "Questrial, sans-serif", fontSize: 13, color: C.dark }}>
                  Commandes ouvertes
                </span>
              </div>
              <span style={{
                fontFamily: "Questrial, sans-serif", fontSize: 12, color: C.vr, fontWeight: 500,
              }}>
                {EVENT.remaining} places restantes
              </span>
            </div>

            {/* CTA */}
            <button style={{
              width: "100%", fontFamily: "Questrial, sans-serif", fontSize: 13,
              letterSpacing: "0.12em", textTransform: "uppercase", padding: "15px 0",
              borderRadius: 50, background: C.rose, color: C.cream, border: "none",
              cursor: "pointer", fontWeight: 500, transition: "all 0.3s ease",
            }}>
              Réserver mes repas →
            </button>
          </div>
        </div>
      </section>

      <FleuronDivider />

      {/* ═══ MENU PREVIEW ═══ */}
      <section style={{ padding: "0 20px 40px", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{
            fontFamily: "Questrial, sans-serif", fontSize: 10, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.olive,
          }}>
            La carte
          </span>
          <h2 style={{
            fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: "italic",
            fontWeight: 400, color: C.rose, margin: "6px 0 0",
          }}>
            Notre menu
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {MENU_PREVIEW.map((cat, ci) => (
            <div
              key={cat.cat}
              onMouseEnter={() => setHoveredCat(ci)}
              onMouseLeave={() => setHoveredCat(null)}
              style={{
                padding: "20px 22px",
                background: hoveredCat === ci ? "white" : "transparent",
                borderRadius: hoveredCat === ci ? 16 : 0,
                border: `1px solid ${hoveredCat === ci ? C.border : "transparent"}`,
                transition: "all 0.35s ease",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hoveredCat === ci ? 10 : 0 }}>
                <h3 style={{
                  fontFamily: "Questrial, sans-serif", fontSize: 11, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: C.rose, margin: 0,
                }}>
                  {cat.cat}
                </h3>
                <span style={{
                  fontFamily: "Questrial, sans-serif", fontSize: 11, color: C.muted,
                  transition: "all 0.3s",
                  transform: hoveredCat === ci ? "rotate(90deg)" : "rotate(0)",
                  display: "inline-block",
                }}>
                  →
                </span>
              </div>
              <div style={{
                maxHeight: hoveredCat === ci ? 120 : 0,
                overflow: "hidden", transition: "max-height 0.4s ease, opacity 0.3s",
                opacity: hoveredCat === ci ? 1 : 0,
              }}>
                {cat.items.map((item) => (
                  <div key={item} style={{
                    fontFamily: "Questrial, sans-serif", fontSize: 14, color: C.dark,
                    padding: "5px 0", borderBottom: `1px solid ${C.cream}`,
                  }}>
                    {item}
                  </div>
                ))}
              </div>
              {ci < MENU_PREVIEW.length - 1 && hoveredCat !== ci && (
                <div style={{ borderBottom: `1px solid ${C.border}`, marginTop: 20 }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ background: "white", padding: "48px 20px", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <span style={{
            fontFamily: "Questrial, sans-serif", fontSize: 10, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.olive,
          }}>
            Simple & rapide
          </span>
          <h2 style={{
            fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: "italic",
            fontWeight: 400, color: C.rose, margin: "6px 0 32px",
          }}>
            Comment ça marche
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { num: "01", title: "Choisissez", desc: "Sélectionnez vos jours et composez votre menu" },
              { num: "02", title: "Payez", desc: "Réglez en ligne de façon sécurisée via Stripe" },
              { num: "03", title: "Savourez", desc: "Vos repas livrés chaque jour sur votre stand" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", margin: "0 auto 12px",
                  background: `${C.poudre}30`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Georgia', serif", fontSize: 18, fontStyle: "italic", color: C.rose,
                }}>
                  {s.num}
                </div>
                <div style={{
                  fontFamily: "Questrial, sans-serif", fontSize: 12, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: C.rose, fontWeight: 500, marginBottom: 6,
                }}>
                  {s.title}
                </div>
                <p style={{
                  fontFamily: "Questrial, sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.5,
                }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST / QUOTE ═══ */}
      <section style={{ padding: "48px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="pulse-ornament" style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)" }}>
          <Ornament size={160} color={C.poudre} />
        </div>
        <div style={{ maxWidth: 420, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 32, color: C.poudre, marginBottom: 12 }}>"</div>
          <p style={{
            fontFamily: "'Georgia', serif", fontSize: 20, fontStyle: "italic",
            color: C.rose, lineHeight: 1.6, marginBottom: 16,
          }}>
            Chaque saison, un chapitre. La gourmandise éclot, organique mais maîtrisée.
          </p>
          <div style={{
            fontFamily: "Questrial, sans-serif", fontSize: 10, letterSpacing: "0.16em",
            textTransform: "uppercase", color: C.muted,
          }}>
            — Maison Félicien
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        background: C.rose, padding: "40px 20px 28px", textAlign: "center",
        borderTop: `3px solid ${C.dark}22`,
      }}>
        <div style={{
          fontFamily: "Questrial, sans-serif", fontSize: 9, letterSpacing: "0.35em",
          textTransform: "uppercase", color: C.poudre, marginBottom: 2,
        }}>
          Maison
        </div>
        <div style={{
          fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: "italic",
          color: C.cream, marginBottom: 20,
        }}>
          Félicien
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
          {["Commander", "La Carte", "Contact", "CGV"].map((l) => (
            <span key={l} style={{
              fontFamily: "Questrial, sans-serif", fontSize: 11, letterSpacing: "0.1em",
              textTransform: "uppercase", color: C.poudre, cursor: "pointer",
            }}>
              {l}
            </span>
          ))}
        </div>

        <div style={{ width: 40, height: 1, background: `${C.poudre}40`, margin: "0 auto 16px" }} />

        <p style={{
          fontFamily: "Questrial, sans-serif", fontSize: 11, color: `${C.poudre}80`,
          lineHeight: 1.6,
        }}>
          Traiteur événementiel · Salons & Foires<br />
          © 2026 Maison Félicien — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
