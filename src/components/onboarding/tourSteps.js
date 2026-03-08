/**
 * Tour steps definitions per admin page.
 * Each step targets a `data-tour="<target>"` attribute.
 */

export const TOUR_STEPS = {
  dashboard: [
    {
      target: 'event-selector',
      title: 'Sélecteur d\'événement',
      content: 'Choisissez l\'événement actif ici. Tout le tableau de bord s\'adapte en fonction.',
    },
    {
      target: 'stat-cards',
      title: 'Indicateurs clés',
      content: 'Vue rapide : commandes, chiffre d\'affaires, repas à préparer, taux de livraison.',
    },
    {
      target: 'recent-orders',
      title: 'Dernières commandes',
      content: 'Les 5 dernières commandes. Accédez à la liste complète via "Voir tout".',
    },
    {
      target: 'kitchen-pipeline',
      title: 'Pipeline cuisine',
      content: 'Suivez l\'avancement en temps réel : en attente → préparation → prêt → livré.',
    },
    {
      target: 'quick-actions',
      title: 'Actions rapides',
      content: 'Raccourcis vers les actions les plus fréquentes : export, menu, rappels.',
    },
  ],

  events: [
    {
      target: 'create-event-btn',
      title: 'Créer un événement',
      content: 'Commencez ici. Définissez les dates, tarifs menus, et catégories de plats.',
    },
    {
      target: 'event-card',
      title: 'Carte événement',
      content: 'Chaque événement a son lien de réservation unique à partager avec vos clients.',
    },
    {
      target: 'menu-config',
      title: 'Configuration menu',
      content: 'Associez les plats de votre carte à cet événement et personnalisez les prix.',
    },
  ],

  menu: [
    {
      target: 'category-tabs',
      title: 'Catégories',
      content: 'Organisez vos plats par catégorie : entrées, plats, desserts, boissons.',
    },
    {
      target: 'add-menu-item',
      title: 'Ajouter un plat',
      content: 'Créez vos plats avec prix, description et tags allergènes.',
    },
  ],

  orders: [
    {
      target: 'order-tabs',
      title: 'Deux vues',
      content: 'Vue financière pour la compta, vue quotidienne pour l\'opérationnel.',
    },
    {
      target: 'order-filters',
      title: 'Filtres',
      content: 'Filtrez par statut de paiement, créneau, ou recherchez un client.',
    },
  ],

  users: [
    {
      target: 'add-user-btn',
      title: 'Ajouter un utilisateur',
      content: 'Créez des comptes staff (cuisine/livraison) ou admin pour votre équipe.',
    },
    {
      target: 'user-roles',
      title: 'Rôles',
      content: 'Admin = accès total. Staff = cuisine et livraisons uniquement.',
    },
  ],
};

/**
 * Startup checklist steps — auto-detected from data.
 */
export const CHECKLIST_STEPS = [
  {
    id: 'create-event',
    label: 'Créer un événement',
    link: '/admin/events',
    check: (data) => (data.events?.length || 0) >= 1,
  },
  {
    id: 'configure-menu',
    label: 'Configurer la carte',
    link: '/admin/menu',
    check: (data) => (data.menuItems?.length || 0) >= 3,
  },
  {
    id: 'link-menu-event',
    label: 'Associer plats à l\'événement',
    link: '/admin/events',
    check: (data) => (data.eventMenuItems?.length || 0) >= 1,
  },
  {
    id: 'create-staff',
    label: 'Créer un compte staff',
    link: '/admin/users',
    check: (data) => (data.profiles || []).some((p) => p.role === 'staff'),
  },
  {
    id: 'first-order',
    label: 'Recevoir une commande',
    link: '/admin/orders',
    check: (data) => (data.orders?.length || 0) >= 1,
  },
];
