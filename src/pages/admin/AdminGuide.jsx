import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Process data
   ═══════════════════════════════════════════════════ */

const PROCESSES = [
  {
    id: 'event',
    icon: '🎪',
    title: 'Créer un événement',
    subtitle: "De la création à l'ouverture des commandes",
    colorClass: 'text-mf-vert-olive',
    borderClass: 'border-mf-vert-olive',
    bgClass: 'bg-mf-vert-olive',
    lightBg: 'bg-mf-vert-olive/5',
    numBg: 'bg-mf-vert-olive/10',
    numBgActive: 'bg-mf-vert-olive',
    steps: [
      { action: "Créer l'événement", detail: "Allez dans Événements → '+ Créer un événement'. Renseignez le nom, les dates, le lieu et le prix par créneau (midi/soir).", link: '/admin/events', linkLabel: 'Événements' },
      { action: 'Ajouter une image', detail: "Uploadez une photo du salon ou du lieu. Elle apparaîtra sur la landing page dans la carte événement." },
      { action: 'Configurer les créneaux', detail: 'Définissez la capacité max par créneau si besoin. Par défaut : illimité.', tip: "Midi et Soir sont créés automatiquement pour chaque jour de l'événement." },
      { action: 'Associer le menu', detail: "Ouvrez 'Configurer le menu' et cochez les plats disponibles pour cet événement parmi votre carte.", link: '/admin/menu', linkLabel: 'La Carte' },
      { action: 'Configurer le menu par créneau', detail: "Utilisez le toggle 'Même menu pour tous les créneaux' pour appliquer la même sélection à tous les slots, ou passez en 'Menu différent par créneau' pour personnaliser chaque créneau individuellement.", tip: "Le mode 'Même menu' est activé par défaut — idéal si votre carte ne change pas entre midi et soir." },
      { action: 'Activer les suppléments', detail: "Dans la section 'Suppléments à la carte', activez le toggle sur les articles disponibles en supplément hors formule. Renseignez le prix unitaire pour chaque supplément.", tip: "Si le prix unitaire est vide, le prix catalogue sera utilisé." },
      { action: "Activer l'événement", detail: "Cliquez 'Activer' — l'événement apparaît sur la landing page et les commandes sont ouvertes.", warn: 'Vérifiez le menu et les prix AVANT d\'activer. Les clients peuvent commander immédiatement.' },
      { action: 'Vérifier la landing', detail: "Ouvrez la page d'accueil et vérifiez que la carte événement s'affiche correctement avec les bonnes dates.", link: '/', linkLabel: 'Voir la landing' },
    ],
  },
  {
    id: 'supplements',
    icon: '🧀',
    title: 'Configurer les suppléments',
    subtitle: 'Articles hors formule à la carte',
    colorClass: 'text-mf-vert-olive',
    borderClass: 'border-mf-vert-olive',
    bgClass: 'bg-mf-vert-olive',
    lightBg: 'bg-mf-vert-olive/5',
    numBg: 'bg-mf-vert-olive/10',
    numBgActive: 'bg-mf-vert-olive',
    steps: [
      { action: 'Ouvrir la section Suppléments', detail: "Allez dans Événements → cliquez 'Configurer le menu' sur un événement → scrollez jusqu'à la section 'Suppléments à la carte'.", link: '/admin/events', linkLabel: 'Événements' },
      { action: 'Activer les articles en supplément', detail: "Cochez le toggle sur les articles que vous souhaitez rendre disponibles en supplément hors formule. Seuls les articles déjà dans le catalogue de l'événement apparaissent." },
      { action: 'Renseigner le prix unitaire', detail: "Pour chaque supplément activé, renseignez le prix unitaire dans le champ dédié. Si le champ est vide, le prix catalogue sera utilisé.", tip: "Les suppléments s'ajoutent au prix de la formule. Le client voit le prix unitaire dans le funnel de commande." },
      { action: 'Vérifier côté client', detail: "Le client verra une section 'Suppléments' dans le funnel de commande (étape 2 — Menus) avec les articles activés et leur prix unitaire. Il peut en commander plusieurs par créneau.", link: '/order', linkLabel: 'Voir le funnel' },
    ],
  },
  {
    id: 'orders',
    icon: '📦',
    title: 'Gérer les commandes',
    subtitle: 'Réception, validation, remboursement',
    colorClass: 'text-mf-rose',
    borderClass: 'border-mf-rose',
    bgClass: 'bg-mf-rose',
    lightBg: 'bg-mf-rose/5',
    numBg: 'bg-mf-rose/10',
    numBgActive: 'bg-mf-rose',
    steps: [
      { action: 'Nouvelle commande reçue', detail: "Un badge rouge apparaît sur 'Commandes' dans la sidebar. Le paiement est automatique via Stripe — la commande arrive déjà payée.", link: '/admin/orders', linkLabel: 'Commandes', tip: 'Vous et le client recevez un email de confirmation automatique.' },
      { action: 'Consulter le détail', detail: 'Cliquez sur une commande pour voir : client, stand, créneaux, menus choisis par convive, montant.' },
      { action: 'Marquer comme test', detail: "Pour vos commandes de test, cliquez '🧪 Test' dans le détail. Les tests sont exclus des statistiques et du chiffre d'affaires.", tip: "Utilisez le filtre 'Masquer les tests' pour nettoyer la vue." },
      { action: 'Rembourser si nécessaire', detail: "Dans le détail de la commande, cliquez 'Rembourser'. Le remboursement Stripe est automatique et le client est notifié par email.", warn: 'Un remboursement est irréversible.' },
      { action: 'Voir le détail', detail: "Le détail complet d'une commande est accessible depuis le Dashboard (clic sur une ligne) ET depuis la page Commandes (clic sur une ligne → modal).", tip: "Le Dashboard affiche un aperçu rapide, la page Commandes offre les actions complètes (remboursement, test, suppression)." },
    ],
  },
  {
    id: 'kitchen',
    icon: '👨‍🍳',
    title: 'Préparer en cuisine',
    subtitle: 'Du pending au ticket QR',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange',
    bgClass: 'bg-status-orange',
    lightBg: 'bg-status-orange/5',
    numBg: 'bg-status-orange/10',
    numBgActive: 'bg-status-orange',
    steps: [
      { action: "Ouvrir l'espace cuisine", detail: "Le staff cuisine accède à /staff/kitchen sur son téléphone. Les commandes payées apparaissent dans l'onglet 'Attente'.", link: '/staff/kitchen', linkLabel: 'Espace Cuisine', tip: 'La page se met à jour en temps réel — pas besoin de recharger.' },
      { action: 'Avancer les items', detail: "Pour chaque plat, appuyez sur ▶ pour le passer en 'En préparation' puis en 'Prêt'. Vous pouvez aussi utiliser le bouton 'Toute la commande' pour avancer tous les plats d'un coup." },
      { action: 'Vérifier les allergies', detail: "Un bandeau orange ⚠ s'affiche si des allergènes sont déclarés. Lisez-le AVANT de préparer.", warn: 'Ne jamais ignorer un bandeau allergie.' },
      { action: 'Gérer les suppléments', detail: "Les suppléments commandés sont affichés séparément des plats de la formule avec un badge 'SUPP.' orange. Avancez-les dans le pipeline comme les autres plats." },
      { action: 'Imprimer le ticket QR', detail: "Quand TOUS les plats d'un créneau sont 'Prêt', le bouton '🖨 Ticket' apparaît. Imprimez-le et collez-le sur le sac de livraison.", tip: 'Le ticket contient : stand, items, allergies, suppléments et le QR code pour la livraison.' },
    ],
  },
  {
    id: 'delivery',
    icon: '🚚',
    title: 'Livrer au stand',
    subtitle: 'Scanner → Photo → Confirmé',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green',
    bgClass: 'bg-status-green',
    lightBg: 'bg-status-green/5',
    numBg: 'bg-status-green/10',
    numBgActive: 'bg-status-green',
    steps: [
      { action: 'Prendre le sac', detail: 'Prenez le sac avec le ticket QR collé dessus. Vérifiez visuellement que le stand correspond.' },
      { action: 'Scanner le QR code', detail: "Avec l'appareil photo de votre téléphone, scannez le QR code sur le ticket. La page de livraison s'ouvre automatiquement.", tip: "Pas besoin d'être connecté — le QR contient le lien direct." },
      { action: 'Vérifier la commande', detail: 'La page affiche le stand, le client, et tous les items (y compris les suppléments). Vérifiez que tout correspond au contenu du sac.', warn: 'Si des items ne sont pas prêts, la confirmation est bloquée. Retournez en cuisine.', tip: 'Le ticket QR inclut les suppléments — vérifiez qu\'ils sont bien dans le sac.' },
      { action: 'Prendre la photo', detail: "La caméra s'ouvre automatiquement. Prenez une photo du sac posé au stand — c'est la preuve de livraison.", tip: "La photo est obligatoire et archivée. Elle est visible dans l'admin." },
      { action: 'Confirmer la livraison', detail: "Appuyez '✓ Confirmer'. Le statut passe à 'Livré', le client reçoit un email satisfaction, et le dashboard admin se met à jour instantanément." },
    ],
  },
  {
    id: 'emails',
    icon: '📧',
    title: 'Gérer les emails',
    subtitle: 'Templates, envoi manuel, historique',
    colorClass: 'text-mf-vieux-rose',
    borderClass: 'border-mf-vieux-rose',
    bgClass: 'bg-mf-vieux-rose',
    lightBg: 'bg-mf-vieux-rose/5',
    numBg: 'bg-mf-vieux-rose/10',
    numBgActive: 'bg-mf-vieux-rose',
    steps: [
      { action: 'Configurer les emails automatiques', detail: "Dans Notifications → onglet 'Emails automatiques'. Activez/désactivez chaque email, modifiez l'objet et l'introduction. Les placeholders ({order_number}, {stand}...) sont remplacés automatiquement.", link: '/admin/notifications', linkLabel: 'Notifications', tip: "Utilisez 'Envoyer un test' pour vérifier le rendu avant d'activer." },
      { action: 'Envoyer un email manuel', detail: "Onglet 'Envoi manuel'. Choisissez un client, tous les clients d'un événement, ou tapez un email. Rédigez votre message et envoyez." },
      { action: "Consulter l'historique", detail: "Onglet 'Historique'. Tous les emails envoyés sont loggés avec la date, le destinataire et le statut (envoyé/erreur)." },
      { action: 'Modifier l\'heure des rappels J-1', detail: "Les rappels J-1 (admin + client) sont envoyés à l'heure configurée (par défaut 17h UTC = 18h Paris). Modifiez dans le champ 'Heure d'envoi'.", tip: "En heure d'été, 17h UTC = 19h Paris." },
    ],
  },
  {
    id: 'stats',
    icon: '📊',
    title: 'Suivre les performances',
    subtitle: 'CA, clients, satisfaction, fidélité',
    colorClass: 'text-mf-marron-glace',
    borderClass: 'border-mf-marron-glace',
    bgClass: 'bg-mf-marron-glace',
    lightBg: 'bg-mf-marron-glace/5',
    numBg: 'bg-mf-marron-glace/10',
    numBgActive: 'bg-mf-marron-glace',
    steps: [
      { action: 'Consulter le tableau de bord', detail: 'Le Dashboard affiche en temps réel : CA, commandes payées, pipeline cuisine et revenus par jour (midi/soir).', link: '/admin', linkLabel: 'Dashboard' },
      { action: 'Vue globale tous événements', detail: "Sélectionnez '📊 Tous les événements' en haut de la page Statistiques. Le CA, les commandes, le panier moyen et les clients sont agrégés sur l'ensemble de vos événements.", link: '/admin/stats', linkLabel: 'Statistiques', tip: 'Les clients sont dédupliqués par email à travers tous les événements.' },
      { action: 'Analyser par événement', detail: 'Sélectionnez un événement spécifique. Filtrez par créneau (midi/soir) et période. Voyez les plats les plus commandés et le CA par jour.' },
      { action: 'Suivre vos clients', detail: "Onglet 'Clients'. Chaque client a un profil avec : nombre de commandes, CA total, événements, satisfaction et badge fidélité (Nouveau / Régulier / Fidèle).", tip: 'Cliquez sur un client pour voir sa timeline complète de commandes.' },
      { action: 'Lire les retours satisfaction', detail: 'Après chaque livraison, le client note de 😍 à 😞. Les notes et commentaires apparaissent dans les stats et dans le détail client.' },
      { action: 'Comprendre les suppléments dans les stats', detail: "Les suppléments sont inclus dans le chiffre d'affaires total mais ne sont pas comptés dans le classement des plats les plus commandés (qui ne montre que les formules)." },
    ],
  },
  {
    id: 'users',
    icon: '👥',
    title: 'Gérer les utilisateurs',
    subtitle: 'Admin, staff cuisine, staff livraison',
    colorClass: 'text-mf-poudre',
    borderClass: 'border-mf-poudre',
    bgClass: 'bg-mf-poudre',
    lightBg: 'bg-mf-poudre/10',
    numBg: 'bg-mf-poudre/20',
    numBgActive: 'bg-mf-poudre',
    steps: [
      { action: 'Ajouter un utilisateur', detail: "Allez dans Accès & droits → '+ Nouvel utilisateur'. Renseignez nom, email, téléphone, mot de passe et rôle (Staff ou Admin).", link: '/admin/users', linkLabel: 'Accès & droits' },
      { action: 'Choisir le rôle', detail: 'Staff = accès cuisine + livraison uniquement. Admin = accès complet (commandes, stats, emails, paramètres).', tip: 'Créez des comptes Staff pour votre équipe cuisine et livraison.' },
      { action: 'Modifier ou supprimer', detail: "Cliquez sur un utilisateur pour modifier ses infos ou son rôle. La suppression est définitive.", warn: 'Ne supprimez pas le dernier admin !' },
    ],
  },
];

const QUICK_LINKS = [
  { icon: '📦', label: 'Commandes', link: '/admin/orders' },
  { icon: '👨‍🍳', label: 'Cuisine', link: '/staff/kitchen' },
  { icon: '🚚', label: 'Livraisons', link: '/staff/delivery' },
  { icon: '📧', label: 'Notifications', link: '/admin/notifications' },
  { icon: '📊', label: 'Statistiques', link: '/admin/stats' },
  { icon: '🎪', label: 'Événements', link: '/admin/events' },
];

const PIPELINE_STEPS = [
  { step: 'Commande payée', icon: '💳' },
  { step: 'Préparation', icon: '👨‍🍳' },
  { step: 'Ticket QR imprimé', icon: '🖨' },
  { step: 'Livraison + photo', icon: '📷' },
  { step: 'Email satisfaction', icon: '😍' },
];

/* ═══════════════════════════════════════════════════
   AdminGuide
   ═══════════════════════════════════════════════════ */

export default function AdminGuide() {
  const [activeProcess, setActiveProcess] = useState('event');
  const [expandedStep, setExpandedStep] = useState(null);
  const [search, setSearch] = useState('');

  const current = PROCESSES.find((p) => p.id === activeProcess);

  // Search filter — matches across all processes
  const searchResults = search.trim()
    ? PROCESSES.flatMap((p) =>
        p.steps
          .map((s, i) => ({ process: p, step: s, index: i }))
          .filter(
            ({ step }) =>
              step.action.toLowerCase().includes(search.toLowerCase()) ||
              step.detail.toLowerCase().includes(search.toLowerCase()),
          ),
      )
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px]">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-[28px] italic text-mf-rose">Mode d'emploi</h1>
          <p className="font-body text-[13px] text-mf-muted mt-0.5">
            Guides pas-à-pas pour chaque processus clé
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full sm:w-[220px] rounded-full border border-mf-border bg-white pl-10 pr-4 py-2 font-body text-[13px] text-mf-marron-glace placeholder:text-mf-muted/50 outline-none focus:border-mf-rose/40 transition-colors"
          />
        </div>
      </div>

      {/* ─── Search results ─── */}
      {searchResults && (
        <div className="bg-white rounded-2xl border border-mf-border p-5 space-y-2">
          <p className="font-body text-[11px] uppercase tracking-wider text-mf-muted mb-3">
            {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''}
          </p>
          {searchResults.length === 0 && (
            <p className="font-body text-[13px] text-mf-muted text-center py-6">Aucun résultat</p>
          )}
          {searchResults.map(({ process, step, index }) => (
            <button
              key={`${process.id}-${index}`}
              onClick={() => {
                setActiveProcess(process.id);
                setExpandedStep(index);
                setSearch('');
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-mf-poudre/10 transition-colors cursor-pointer bg-transparent border-none"
            >
              <span className="text-lg shrink-0">{process.icon}</span>
              <div className="min-w-0">
                <p className="font-body text-[13px] font-medium text-mf-marron-glace">{step.action}</p>
                <p className="font-body text-[11px] text-mf-muted truncate">{process.title} · Étape {index + 1}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ─── Process navigation (horizontal scroll) ─── */}
      {!searchResults && (
        <>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {PROCESSES.map((p) => {
              const isActive = activeProcess === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setActiveProcess(p.id); setExpandedStep(null); }}
                  className={`flex-none flex items-center gap-2.5 px-4 py-3 rounded-xl border-[1.5px] transition-all duration-300 cursor-pointer min-w-[155px] ${
                    isActive
                      ? `bg-white ${p.borderClass} shadow-sm`
                      : 'bg-transparent border-mf-border hover:-translate-y-0.5'
                  }`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <span className={`text-2xl w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isActive ? p.lightBg : 'bg-mf-border/30'
                  }`}>
                    {p.icon}
                  </span>
                  <div className="text-left">
                    <div className={`font-body text-[12px] font-semibold transition-colors duration-300 ${
                      isActive ? p.colorClass : 'text-mf-marron-glace'
                    }`}>
                      {p.title}
                    </div>
                    <div className="font-body text-[10px] text-mf-muted">{p.steps.length} étapes</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── Content: Steps + Sidebar ─── */}
          <div className="flex gap-7">
            {/* LEFT — Steps */}
            <div className="flex-1 min-w-0 max-w-[640px]">
              {/* Process header */}
              <div className={`${current.lightBg} rounded-2xl p-6 mb-6 border-l-4 ${current.borderClass}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[32px]">{current.icon}</span>
                  <div>
                    <h2 className={`font-serif text-[22px] italic font-normal ${current.colorClass}`}>{current.title}</h2>
                    <p className="font-body text-[12px] text-mf-muted mt-0.5">{current.subtitle}</p>
                  </div>
                </div>
                {/* Progress bar segments */}
                <div className="flex gap-1 mt-3">
                  {current.steps.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-[3px] rounded-full transition-all duration-300 ${
                        i <= (expandedStep ?? -1) ? `${current.bgClass}/30` : `${current.bgClass}/10`
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Steps list */}
              <div className="relative">
                {current.steps.map((step, i) => {
                  const isExpanded = expandedStep === i;
                  return (
                    <div key={i} className="relative mb-1.5">
                      {/* Connector line */}
                      {i < current.steps.length - 1 && (
                        <div className={`absolute left-[25px] top-[44px] bottom-[-6px] w-[2px] ${current.bgClass}/10`} />
                      )}

                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : i)}
                        className={`w-full text-left flex gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-300 border bg-transparent ${
                          isExpanded
                            ? 'bg-white border-mf-border'
                            : 'border-transparent hover:bg-mf-poudre/5'
                        }`}
                      >
                        {/* Step number circle */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-[14px] font-semibold shrink-0 transition-all duration-300 ${
                          isExpanded
                            ? `${current.bgClass} text-white`
                            : `${current.numBg} ${current.colorClass}`
                        }`}>
                          {i + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-body text-[14px] font-semibold text-mf-marron-glace transition-all ${isExpanded ? 'mb-2' : ''}`}>
                            {step.action}
                          </div>

                          {/* Expanded body */}
                          <div
                            className="overflow-hidden transition-all duration-350"
                            style={{
                              maxHeight: isExpanded ? 300 : 0,
                              opacity: isExpanded ? 1 : 0,
                            }}
                          >
                            <p className="font-body text-[13px] leading-relaxed text-mf-muted mb-2.5">
                              {step.detail}
                            </p>

                            {/* Tip */}
                            {step.tip && (
                              <div className="px-3.5 py-2.5 rounded-[10px] bg-mf-vert-olive/5 border border-mf-vert-olive/10 font-body text-[12px] text-mf-vert-olive leading-relaxed mb-2">
                                💡 {step.tip}
                              </div>
                            )}

                            {/* Warning */}
                            {step.warn && (
                              <div className="px-3.5 py-2.5 rounded-[10px] bg-status-orange/5 border border-status-orange/15 font-body text-[12px] text-status-orange leading-relaxed mb-2">
                                ⚠ {step.warn}
                              </div>
                            )}

                            {/* Link */}
                            {step.link && (
                              <Link
                                to={step.link}
                                className={`inline-flex items-center gap-1.5 font-body text-[12px] font-medium ${current.colorClass} hover:translate-x-0.5 transition-transform`}
                              >
                                → {step.linkLabel}
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Chevron */}
                        <ChevronDown className={`w-3.5 h-3.5 text-mf-muted shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — Sidebar (hidden on mobile) */}
            <div className="hidden lg:block w-[280px] shrink-0 space-y-4">
              {/* Quick links */}
              <div className="bg-white rounded-2xl border border-mf-border p-5 sticky top-5">
                <p className="font-body text-[11px] uppercase tracking-wider text-mf-vieux-rose font-semibold mb-3.5">
                  Accès rapide
                </p>
                {QUICK_LINKS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.link}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] font-body text-[13px] text-mf-marron-glace hover:bg-mf-poudre/10 transition-all duration-200 hover:translate-x-0.5"
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Pipeline flow */}
              <div className="bg-white rounded-2xl border border-mf-border p-5">
                <p className="font-body text-[11px] uppercase tracking-wider text-mf-vieux-rose font-semibold mb-3.5">
                  Flux en un coup d'œil
                </p>
                <div className="flex flex-col">
                  {PIPELINE_STEPS.map((item, i) => (
                    <div key={item.step}>
                      <div className="flex items-center gap-2.5 py-2">
                        <span className="w-7 h-7 rounded-full bg-mf-poudre/20 flex items-center justify-center text-[13px] shrink-0">
                          {item.icon}
                        </span>
                        <span className="font-body text-[12px] text-mf-marron-glace">{item.step}</span>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div className="w-[2px] h-3 bg-mf-border ml-[13px]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Help card */}
              <div className="bg-mf-rose/5 rounded-2xl border border-mf-rose/10 p-5 text-center">
                <div className="text-[28px] mb-2">💬</div>
                <p className="font-serif text-[15px] italic text-mf-rose mb-1.5">Besoin d'aide ?</p>
                <p className="font-body text-[11px] text-mf-muted leading-relaxed mb-3">
                  Contactez le support technique pour toute question.
                </p>
                <a
                  href="mailto:support@maison-felicien.com"
                  className="inline-block px-5 py-2 rounded-full bg-mf-rose text-white font-body text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Contacter
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
