import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// MAISON FÉLICIEN — Admin Guide / Mode d'emploi
// Interactive step-by-step documentation
// ═══════════════════════════════════════════════════════════════

const C = {
  rose: "#8B3A43",
  vieuxRose: "#BF646D",
  poudre: "#E5B7B3",
  vertOlive: "#968A42",
  blancCasse: "#F0F0E6",
  marronGlace: "#392D31",
  white: "#FDFAF7",
  border: "#E5D9D0",
  muted: "#9A8A7C",
  green: "#4A7C59",
  orange: "#C4793A",
};

const processes = [
  {
    id: "event",
    icon: "🎪",
    title: "Créer un événement",
    subtitle: "De la création à l'ouverture des commandes",
    color: C.vertOlive,
    lightBg: `${C.vertOlive}08`,
    steps: [
      { action: "Créer l'événement", detail: "Allez dans Événements → '+ Créer un événement'. Renseignez le nom, les dates, le lieu et le prix par créneau (midi/soir).", link: "/admin/events", linkLabel: "Événements", tip: null },
      { action: "Ajouter une image", detail: "Uploadez une photo du salon ou du lieu. Elle apparaîtra sur la landing page dans la carte événement.", link: null, linkLabel: null, tip: null },
      { action: "Configurer les créneaux", detail: "Définissez la capacité max par créneau si besoin. Par défaut : illimité.", link: null, linkLabel: null, tip: "💡 Midi et Soir sont créés automatiquement pour chaque jour de l'événement." },
      { action: "Associer le menu", detail: "Ouvrez 'Configurer le menu' et cochez les plats disponibles pour cet événement parmi votre carte.", link: "/admin/menu", linkLabel: "La Carte", tip: null },
      { action: "Activer l'événement", detail: "Cliquez 'Activer' — l'événement apparaît sur la landing page et les commandes sont ouvertes.", link: null, linkLabel: null, warn: "⚠ Vérifiez le menu et les prix AVANT d'activer. Les clients peuvent commander immédiatement." },
      { action: "Vérifier la landing", detail: "Ouvrez la page d'accueil et vérifiez que la carte événement s'affiche correctement avec les bonnes dates.", link: "/", linkLabel: "Voir la landing", tip: null },
    ]
  },
  {
    id: "orders",
    icon: "📦",
    title: "Gérer les commandes",
    subtitle: "Réception, validation, remboursement",
    color: C.rose,
    lightBg: `${C.rose}08`,
    steps: [
      { action: "Nouvelle commande reçue", detail: "Un badge rouge apparaît sur 'Commandes' dans la sidebar. Le paiement est automatique via Stripe — la commande arrive déjà payée.", link: "/admin/orders", linkLabel: "Commandes", tip: "💡 Vous et le client recevez un email de confirmation automatique." },
      { action: "Consulter le détail", detail: "Cliquez sur une commande pour voir : client, stand, créneaux, menus choisis par convive, montant.", link: null, linkLabel: null, tip: null },
      { action: "Marquer comme test", detail: "Pour vos commandes de test, cliquez '🧪 Test' dans le détail. Les tests sont exclus des statistiques.", link: null, linkLabel: null, tip: "💡 Utilisez le filtre 'Masquer les tests' pour nettoyer la vue." },
      { action: "Rembourser si nécessaire", detail: "Dans le détail de la commande, cliquez 'Rembourser'. Le remboursement Stripe est automatique et le client est notifié par email.", link: null, linkLabel: null, warn: "⚠ Un remboursement est irréversible." },
    ]
  },
  {
    id: "kitchen",
    icon: "👨‍🍳",
    title: "Préparer en cuisine",
    subtitle: "Du pending au ticket QR",
    color: C.orange,
    lightBg: `${C.orange}08`,
    steps: [
      { action: "Ouvrir l'espace cuisine", detail: "Le staff cuisine accède à /staff/kitchen sur son téléphone. Les commandes payées apparaissent dans l'onglet 'Attente'.", link: "/staff/kitchen", linkLabel: "Espace Cuisine", tip: "💡 La page se met à jour en temps réel — pas besoin de recharger." },
      { action: "Avancer les items", detail: "Pour chaque plat, appuyez sur ▶ pour le passer en 'En préparation' puis en 'Prêt'. Vous pouvez aussi utiliser le bouton 'Toute la commande' pour avancer tous les plats d'un coup.", link: null, linkLabel: null, tip: null },
      { action: "Vérifier les allergies", detail: "Un bandeau orange ⚠ s'affiche si des allergènes sont déclarés. Lisez-le AVANT de préparer.", link: null, linkLabel: null, warn: "⚠ Ne jamais ignorer un bandeau allergie." },
      { action: "Imprimer le ticket QR", detail: "Quand TOUS les plats d'un créneau sont 'Prêt', le bouton '🖨 Ticket' apparaît. Imprimez-le et collez-le sur le sac de livraison.", link: null, linkLabel: null, tip: "💡 Le ticket contient : stand, items, allergies, et le QR code pour la livraison." },
    ]
  },
  {
    id: "delivery",
    icon: "🚚",
    title: "Livrer au stand",
    subtitle: "Scanner → Photo → Confirmé",
    color: C.green,
    lightBg: `${C.green}08`,
    steps: [
      { action: "Prendre le sac", detail: "Prenez le sac avec le ticket QR collé dessus. Vérifiez visuellement que le stand correspond.", link: null, linkLabel: null, tip: null },
      { action: "Scanner le QR code", detail: "Avec l'appareil photo de votre téléphone, scannez le QR code sur le ticket. La page de livraison s'ouvre automatiquement.", link: null, linkLabel: null, tip: "💡 Pas besoin d'être connecté — le QR contient le lien direct." },
      { action: "Vérifier la commande", detail: "La page affiche le stand, le client, et tous les items. Vérifiez que tout correspond au contenu du sac.", link: null, linkLabel: null, warn: "⚠ Si des items ne sont pas prêts, la confirmation est bloquée. Retournez en cuisine." },
      { action: "Prendre la photo", detail: "La caméra s'ouvre automatiquement. Prenez une photo du sac posé au stand — c'est la preuve de livraison.", link: null, linkLabel: null, tip: "💡 La photo est obligatoire et archivée. Elle est visible dans l'admin." },
      { action: "Confirmer la livraison", detail: "Appuyez '✓ Confirmer'. Le statut passe à 'Livré', le client reçoit un email satisfaction, et le dashboard admin se met à jour instantanément.", link: null, linkLabel: null, tip: null },
    ]
  },
  {
    id: "emails",
    icon: "📧",
    title: "Gérer les emails",
    subtitle: "Templates, envoi manuel, historique",
    color: C.vieuxRose,
    lightBg: `${C.vieuxRose}08`,
    steps: [
      { action: "Configurer les emails automatiques", detail: "Dans Notifications → onglet 'Emails automatiques'. Activez/désactivez chaque email, modifiez l'objet et l'introduction. Les placeholders ({order_number}, {stand}...) sont remplacés automatiquement.", link: "/admin/notifications", linkLabel: "Notifications", tip: "💡 Utilisez 'Envoyer un test' pour vérifier le rendu avant d'activer." },
      { action: "Envoyer un email manuel", detail: "Onglet 'Envoi manuel'. Choisissez un client, tous les clients d'un événement, ou tapez un email. Rédigez votre message et envoyez.", link: null, linkLabel: null, tip: null },
      { action: "Consulter l'historique", detail: "Onglet 'Historique'. Tous les emails envoyés sont loggés avec la date, le destinataire et le statut (envoyé/erreur).", link: null, linkLabel: null, tip: null },
      { action: "Modifier l'heure des rappels J-1", detail: "Les rappels J-1 (admin + client) sont envoyés à l'heure configurée (par défaut 17h UTC = 18h Paris). Modifiez dans le champ 'Heure d'envoi'.", link: null, linkLabel: null, tip: "💡 En heure d'été, 17h UTC = 19h Paris." },
    ]
  },
  {
    id: "stats",
    icon: "📊",
    title: "Suivre les performances",
    subtitle: "CA, clients, satisfaction, fidélité",
    color: C.marronGlace,
    lightBg: `${C.marronGlace}08`,
    steps: [
      { action: "Consulter le tableau de bord", detail: "Le Dashboard affiche en temps réel : CA, commandes payées, pipeline cuisine et revenus par jour (midi/soir).", link: "/admin", linkLabel: "Dashboard", tip: null },
      { action: "Analyser par événement", detail: "Dans Statistiques → vue générale. Filtrez par événement, créneau (midi/soir), et période. Voyez les plats les plus commandés et le CA par jour.", link: "/admin/stats", linkLabel: "Statistiques", tip: null },
      { action: "Suivre vos clients", detail: "Onglet 'Clients'. Chaque client a un profil avec : nombre de commandes, CA total, événements, satisfaction et badge fidélité (Nouveau / Régulier / Fidèle).", link: null, linkLabel: null, tip: "💡 Cliquez sur un client pour voir sa timeline complète de commandes." },
      { action: "Lire les retours satisfaction", detail: "Après chaque livraison, le client note de 😍 à 😞. Les notes et commentaires apparaissent dans les stats et dans le détail client.", link: null, linkLabel: null, tip: null },
    ]
  },
  {
    id: "users",
    icon: "👥",
    title: "Gérer les utilisateurs",
    subtitle: "Admin, staff cuisine, staff livraison",
    color: C.poudre,
    lightBg: `${C.poudre}18`,
    steps: [
      { action: "Ajouter un utilisateur", detail: "Allez dans Accès & droits → '+ Nouvel utilisateur'. Renseignez nom, email, téléphone, mot de passe et rôle (Staff ou Admin).", link: "/admin/users", linkLabel: "Accès & droits", tip: null },
      { action: "Choisir le rôle", detail: "Staff = accès cuisine + livraison uniquement. Admin = accès complet (commandes, stats, emails, paramètres).", link: null, linkLabel: null, tip: "💡 Créez des comptes Staff pour votre équipe cuisine et livraison." },
      { action: "Modifier ou supprimer", detail: "Cliquez sur un utilisateur pour modifier ses infos ou son rôle. La suppression est définitive.", link: null, linkLabel: null, warn: "⚠ Ne supprimez pas le dernier admin !" },
    ]
  },
];

// ─── Step dot connector ───
const StepConnector = ({ color, isLast }) => (
  !isLast ? (
    <div style={{
      position: "absolute", left: 17, top: 40, bottom: -8,
      width: 2, background: `${color}20`,
    }} />
  ) : null
);

export default function AdminGuideMockup() {
  const [activeProcess, setActiveProcess] = useState("event");
  const [expandedStep, setExpandedStep] = useState(null);

  const current = processes.find(p => p.id === activeProcess);

  return (
    <div style={{
      background: C.blancCasse, minHeight: "100vh",
      fontFamily: "Questrial, system-ui, sans-serif", color: C.marronGlace,
    }}>
      <style>{`
        .guide-nav-item { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
        .guide-nav-item:hover { transform: translateY(-2px); }
        .guide-step { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
        .guide-step:hover { background: ${C.poudre}08; }
        .guide-link { transition: all 0.2s; }
        .guide-link:hover { transform: translateX(3px); color: ${C.rose}; }
        ::selection { background: ${C.poudre}; color: ${C.rose}; }
      `}</style>

      {/* ─── HEADER ─── */}
      <div style={{ padding: "32px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <h1 style={{
              fontFamily: "Georgia, serif", fontStyle: "italic",
              fontSize: 28, fontWeight: 400, color: C.rose, margin: 0,
            }}>Mode d'emploi</h1>
            <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0" }}>
              Guides pas-à-pas pour chaque processus clé
            </p>
          </div>
          {/* Quick search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 50, padding: "8px 16px", fontSize: 13, color: C.muted,
          }}>
            🔍 <span style={{ opacity: 0.5 }}>Rechercher...</span>
          </div>
        </div>
      </div>

      {/* ─── PROCESS NAVIGATION ─── */}
      <div style={{
        padding: "20px 32px",
        display: "flex", gap: 10, overflowX: "auto",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}>
        {processes.map((p) => {
          const isActive = activeProcess === p.id;
          return (
            <div
              key={p.id}
              className="guide-nav-item"
              onClick={() => { setActiveProcess(p.id); setExpandedStep(null); }}
              style={{
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 18px",
                borderRadius: 14,
                background: isActive ? C.white : "transparent",
                border: `1.5px solid ${isActive ? p.color : C.border}`,
                boxShadow: isActive ? `0 4px 20px ${p.color}12` : "none",
                minWidth: 160,
              }}
            >
              <span style={{
                fontSize: 24,
                width: 40, height: 40, borderRadius: 10,
                background: isActive ? `${p.color}15` : `${C.border}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}>{p.icon}</span>
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: isActive ? p.color : C.marronGlace,
                  transition: "color 0.3s",
                }}>{p.title}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{p.steps.length} étapes</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ padding: "8px 32px 48px", display: "flex", gap: 28 }}>

        {/* LEFT — Steps */}
        <div style={{ flex: 1, maxWidth: 640 }}>
          {/* Process header */}
          <div style={{
            padding: "24px 28px",
            background: current.lightBg,
            borderRadius: 18,
            marginBottom: 24,
            borderLeft: `4px solid ${current.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>{current.icon}</span>
              <div>
                <h2 style={{
                  fontFamily: "Georgia, serif", fontStyle: "italic",
                  fontSize: 22, fontWeight: 400, color: current.color, margin: 0,
                }}>{current.title}</h2>
                <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>{current.subtitle}</p>
              </div>
            </div>
            {/* Progress indicator */}
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {current.steps.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: `${current.color}${i <= (expandedStep ?? -1) ? '40' : '15'}`,
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
          </div>

          {/* Steps list */}
          <div style={{ position: "relative" }}>
            {current.steps.map((step, i) => {
              const isExpanded = expandedStep === i;
              return (
                <div key={i} style={{ position: "relative", marginBottom: 6 }}>
                  {/* Connector line */}
                  {i < current.steps.length - 1 && (
                    <div style={{
                      position: "absolute", left: 17, top: 44, bottom: -6,
                      width: 2, background: `${current.color}15`,
                    }} />
                  )}

                  <div
                    className="guide-step"
                    onClick={() => setExpandedStep(isExpanded ? null : i)}
                    style={{
                      display: "flex", gap: 16, padding: "14px 16px",
                      borderRadius: 14, cursor: "pointer",
                      background: isExpanded ? C.white : "transparent",
                      border: isExpanded ? `1px solid ${C.border}` : "1px solid transparent",
                    }}
                  >
                    {/* Step number */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: isExpanded ? current.color : `${current.color}18`,
                      color: isExpanded ? C.white : current.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600,
                      flexShrink: 0, transition: "all 0.3s",
                    }}>
                      {i + 1}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: C.marronGlace,
                        marginBottom: isExpanded ? 8 : 0,
                      }}>
                        {step.action}
                      </div>

                      {/* Expanded content */}
                      <div style={{
                        maxHeight: isExpanded ? 300 : 0,
                        opacity: isExpanded ? 1 : 0,
                        overflow: "hidden",
                        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                      }}>
                        <p style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, margin: "0 0 10px" }}>
                          {step.detail}
                        </p>

                        {/* Tip */}
                        {step.tip && (
                          <div style={{
                            padding: "10px 14px", borderRadius: 10,
                            background: `${C.vertOlive}08`, border: `1px solid ${C.vertOlive}18`,
                            fontSize: 12, color: C.vertOlive, lineHeight: 1.5,
                            marginBottom: 8,
                          }}>
                            {step.tip}
                          </div>
                        )}

                        {/* Warning */}
                        {step.warn && (
                          <div style={{
                            padding: "10px 14px", borderRadius: 10,
                            background: `${C.orange}08`, border: `1px solid ${C.orange}20`,
                            fontSize: 12, color: C.orange, lineHeight: 1.5,
                            marginBottom: 8,
                          }}>
                            {step.warn}
                          </div>
                        )}

                        {/* Link to admin page */}
                        {step.link && (
                          <a href={step.link} className="guide-link" style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            fontSize: 12, color: current.color, textDecoration: "none",
                            fontWeight: 500,
                          }}>
                            → {step.linkLabel}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <span style={{
                      fontSize: 12, color: C.muted, flexShrink: 0,
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s",
                      marginTop: 4,
                    }}>▼</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Quick reference sidebar */}
        <div style={{ width: 280, flexShrink: 0 }}>
          {/* Quick links */}
          <div style={{
            background: C.white, borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "20px", marginBottom: 16,
            position: "sticky", top: 20,
          }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              color: C.vieuxRose, marginBottom: 14, fontWeight: 600,
            }}>Accès rapide</div>

            {[
              { icon: "📦", label: "Commandes", link: "/admin/orders" },
              { icon: "👨‍🍳", label: "Cuisine", link: "/staff/kitchen" },
              { icon: "🚚", label: "Livraisons", link: "/staff/delivery" },
              { icon: "📧", label: "Notifications", link: "/admin/notifications" },
              { icon: "📊", label: "Statistiques", link: "/admin/stats" },
              { icon: "🎪", label: "Événements", link: "/admin/events" },
            ].map(item => (
              <a key={item.label} href={item.link} className="guide-link" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                textDecoration: "none", color: C.marronGlace, fontSize: 13,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.poudre}15`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>

          {/* Key numbers */}
          <div style={{
            background: C.white, borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "20px", marginBottom: 16,
          }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              color: C.vieuxRose, marginBottom: 14, fontWeight: 600,
            }}>Flux en un coup d'œil</div>

            <div style={{
              display: "flex", flexDirection: "column", gap: 0,
            }}>
              {[
                { step: "Commande payée", icon: "💳" },
                { step: "Préparation", icon: "👨‍🍳" },
                { step: "Ticket QR imprimé", icon: "🖨" },
                { step: "Livraison + photo", icon: "📷" },
                { step: "Email satisfaction", icon: "😍" },
              ].map((item, i, arr) => (
                <div key={item.step}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0",
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `${C.poudre}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, flexShrink: 0,
                    }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: C.marronGlace }}>{item.step}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{
                      width: 2, height: 12, background: `${C.border}`,
                      marginLeft: 13,
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Help card */}
          <div style={{
            background: `${C.rose}08`, borderRadius: 16,
            border: `1px solid ${C.rose}18`,
            padding: "20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{
              fontFamily: "Georgia, serif", fontStyle: "italic",
              fontSize: 15, color: C.rose, marginBottom: 6,
            }}>Besoin d'aide ?</div>
            <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, margin: "0 0 12px" }}>
              Contactez le support technique pour toute question.
            </p>
            <a href="mailto:support@maison-felicien.com" style={{
              display: "inline-block",
              padding: "8px 20px", borderRadius: 50,
              background: C.rose, color: C.white,
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              textDecoration: "none",
            }}>Contacter</a>
          </div>
        </div>
      </div>
    </div>
  );
}
