/**
 * CHEF. RESTAURATION — Module de Réservation
 * Maquette conceptuelle & prototypes de niveau de détail (UX/UI)
 * 
 * Objectif : Établir le design standard pour le funnel de réservation
 * Brand : Maison Félicien (design system existant)
 */

/*
  =============================================================================
  SCREEN 1 : ACCUEIL RÉSERVATION (Landing / Welcome)
  =============================================================================
  
  Layout :
  - Hero minimal avec logo Maison Félicien + sous-titre "Réservez votre table"
  - Message court explicatif (pas de paiement, confirmation par email)
  - Bouton CTA pour commencer
  
  Typo : 
    - Titre : font-serif italic 2xl
    - Texte : font-body regular
    - Couleurs : mf-rose (primaire), mf-marron-glace (texte), mf-poudre (subtle)
  
  Inspiration : Simple, épuré, conforme au style MF
*/

export const ReservationWelcomeScreen = () => (
  <div className="min-h-screen bg-mf-blanc-casse flex flex-col items-center justify-center p-6">
    <div className="max-w-md text-center space-y-6">
      {/* Logo */}
      <div>
        <div className="font-body text-[8px] uppercase tracking-[0.3em] text-mf-vieux-rose">Maison</div>
        <div className="font-serif text-4xl italic text-mf-rose">Félicien</div>
      </div>

      {/* Headline */}
      <h1 className="font-serif text-2xl italic text-mf-marron-glace">
        Réservez votre table
      </h1>

      {/* Description */}
      <p className="font-body text-sm text-mf-muted leading-relaxed">
        Sélectionnez votre créneau, votre table et recevez une confirmation par email.
        Aucun paiement requis — simple et rapide.
      </p>

      {/* CTA */}
      <button className="w-full px-6 py-3 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose transition-colors">
        Commencer →
      </button>

      {/* Reassurance */}
      <p className="text-xs text-mf-muted italic">
        Confidentialité garantie. Vous ne recevrez que votre confirmation.
      </p>
    </div>
  </div>
);

/*
  =============================================================================
  SCREEN 2 : CHOIX SERVICE & CRÉNEAU (Shift + Tour)
  =============================================================================
  
  Layout :
  - Deux sections : Service (midi/soir) puis Créneau horaire (30min slots)
  - Cards avec hover effect
  - Step indicator en haut (progress bar visuelle)
  
  Détails clé :
  - Service card affiche : "Midi" + "11:30 — 14:30" (heures)
  - Après selection, afficher les tours disponibles (ex: "11:30", "12:00", "12:30")
  - Chaque tour = bouton petit grid + durée (45 min)
  - Bouton Continuer activé seulement si tour sélectionné
*/

export const ReservationShiftTourScreen = () => (
  <div className="max-w-2xl mx-auto p-6 py-12">
    {/* Step indicator */}
    <div className="flex gap-2 mb-8 justify-center">
      {[0, 1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 w-8 rounded-full ${s <= 0 ? 'bg-mf-rose' : 'bg-mf-poudre'}`}
        />
      ))}
    </div>

    <h2 className="text-lg font-medium text-mf-marron-glace mb-6">
      1. Choisissez un service
    </h2>

    {/* Service selection */}
    <div className="space-y-3 mb-8">
      {[
        { name: 'Midi', time: '11:30 — 14:30' },
        { name: 'Soir', time: '19:00 — 23:00' },
      ].map((s) => (
        <button
          key={s.name}
          className="w-full text-left px-4 py-3 border-2 border-mf-border rounded-card hover:border-mf-rose/50 hover:bg-mf-rose/5 transition-colors"
        >
          <div className="font-medium text-mf-marron-glace">{s.name}</div>
          <div className="text-sm text-mf-muted">{s.time}</div>
        </button>
      ))}
    </div>

    <h2 className="text-lg font-medium text-mf-marron-glace mb-6">
      2. Choisissez un créneau horaire
    </h2>

    {/* Tour grid (30min slots) */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
      {['11:30', '12:00', '12:30', '13:00', '13:30', '14:00'].map((time) => (
        <button
          key={time}
          className="px-3 py-4 border-2 border-mf-border rounded-card hover:border-mf-rose/50 text-center transition-colors"
        >
          <div className="font-medium text-mf-marron-glace text-base">{time}</div>
          <div className="text-xs text-mf-muted">45 min</div>
        </button>
      ))}
    </div>

    {/* Navigation */}
    <div className="flex gap-3">
      <button className="flex-1 px-4 py-2 border-2 border-mf-rose text-mf-rose font-medium rounded-card hover:bg-mf-rose/5">
        ← Retour
      </button>
      <button className="flex-1 px-4 py-2 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose">
        Continuer →
      </button>
    </div>
  </div>
);

/*
  =============================================================================
  SCREEN 3 : PLAN DE SALLE (Table selection avec carte visuelle)
  =============================================================================
  
  Layout :
  - Grille de tables numérotées (visuelle)
  - Chaque table affiche : Numéro (T1, T2...) + nombre de sièges
  - Couleur : gris neutre si dispo, rose si sélectionnée, muted si pleine (future)
  - Option : affichage SVG/Canvas pour vraie carte seating plan
  
  Détails clé :
  - Tables clickable
  - Visual feedback on hover/select
  - Summary box restant visible (service + heure)
*/

export const ReservationTableSelectionScreen = () => (
  <div className="max-w-2xl mx-auto p-6 py-12">
    {/* Step indicator */}
    <div className="flex gap-2 mb-8 justify-center">
      {[0, 1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 w-8 rounded-full ${s <= 1 ? 'bg-mf-rose' : 'bg-mf-poudre'}`}
        />
      ))}
    </div>

    <h2 className="text-lg font-medium text-mf-marron-glace mb-6">
      3. Sélectionnez une table
    </h2>

    {/* Floor tabs (optional if multiple floors) */}
    <div className="flex gap-2 mb-6">
      {['Salle principale', 'Terrasse'].map((floor) => (
        <button
          key={floor}
          className="px-3 py-1.5 border-2 border-mf-border rounded-card text-sm hover:border-mf-rose/50"
        >
          {floor}
        </button>
      ))}
    </div>

    {/* Seating plan grid */}
    <div className="bg-mf-poudre/10 rounded-card p-8 mb-6">
      <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
        {Array.from({ length: 12 }).map((_, i) => {
          const tableNum = i + 1;
          const seats = 2 + Math.floor(Math.random() * 4); // random 2-6 seats
          return (
            <button
              key={tableNum}
              className="px-2 py-4 border-2 border-mf-border rounded-card hover:border-mf-rose/50 text-center transition-colors"
            >
              <div className="font-medium text-mf-marron-glace text-sm">T{tableNum}</div>
              <div className="text-xs text-mf-muted">{seats} pers.</div>
            </button>
          );
        })}
      </div>
    </div>

    {/* Sticky summary */}
    <div className="bg-mf-poudre/20 border-2 border-mf-border rounded-card p-4 mb-6 space-y-2">
      <div className="text-sm">
        <span className="text-mf-muted">Service :</span>
        <span className="font-medium text-mf-marron-glace"> Midi 12:00</span>
      </div>
    </div>

    {/* Navigation */}
    <div className="flex gap-3">
      <button className="flex-1 px-4 py-2 border-2 border-mf-rose text-mf-rose font-medium rounded-card hover:bg-mf-rose/5">
        ← Retour
      </button>
      <button className="flex-1 px-4 py-2 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose">
        Continuer →
      </button>
    </div>
  </div>
);

/*
  =============================================================================
  SCREEN 4 : INFORMATIONS CLIENT (Name, Email, Party size)
  =============================================================================
  
  Layout :
  - Forme simple : champs texte empilés verticalement
  - Label clair + placeholder utile
  - Input + / − pour partie (UX accessibilité)
  - Summary box avec recap réservation (tout ce qui a été choisi)
  
  Détails clé :
  - Validation en temps réel (border devient rose si valide)
  - Partie size : boutons +/− ou input number
  - Bouton Submit : désactivé tant que requis ne sont pas remplis
*/

export const ReservationGuestInfoScreen = () => (
  <form className="max-w-2xl mx-auto p-6 py-12 space-y-6">
    {/* Step indicator */}
    <div className="flex gap-2 mb-8 justify-center">
      {[0, 1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 w-8 rounded-full ${s <= 2 ? 'bg-mf-rose' : 'bg-mf-poudre'}`}
        />
      ))}
    </div>

    <h2 className="text-lg font-medium text-mf-marron-glace">
      4. Vos informations
    </h2>

    {/* Name */}
    <div>
      <label className="block text-sm font-medium text-mf-marron-glace mb-2">
        Votre nom *
      </label>
      <input
        type="text"
        placeholder="Prénom Nom"
        className="w-full px-4 py-2 border-2 border-mf-border rounded-card focus:outline-none focus:border-mf-rose"
      />
    </div>

    {/* Email */}
    <div>
      <label className="block text-sm font-medium text-mf-marron-glace mb-2">
        Votre email *
      </label>
      <input
        type="email"
        placeholder="contact@example.com"
        className="w-full px-4 py-2 border-2 border-mf-border rounded-card focus:outline-none focus:border-mf-rose"
      />
    </div>

    {/* Party size with +/- buttons */}
    <div>
      <label className="block text-sm font-medium text-mf-marron-glace mb-2">
        Nombre de couverts
      </label>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          className="px-3 py-2 border-2 border-mf-border rounded-card hover:bg-mf-poudre/20"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          max="12"
          defaultValue="2"
          className="w-16 text-center px-2 py-2 border-2 border-mf-border rounded-card focus:outline-none focus:border-mf-rose"
        />
        <button
          type="button"
          className="px-3 py-2 border-2 border-mf-border rounded-card hover:bg-mf-poudre/20"
        >
          +
        </button>
      </div>
    </div>

    {/* Summary recap */}
    <div className="bg-mf-poudre/20 border-2 border-mf-border rounded-card p-4 space-y-2">
      <h3 className="font-medium text-mf-marron-glace mb-3">Récapitulatif</h3>
      <div className="text-sm">
        <span className="text-mf-muted">Service :</span>
        <span className="font-medium text-mf-marron-glace"> Midi 12:00</span>
      </div>
      <div className="text-sm">
        <span className="text-mf-muted">Table :</span>
        <span className="font-medium text-mf-marron-glace"> T7</span>
      </div>
      <div className="text-sm">
        <span className="text-mf-muted">Couverts :</span>
        <span className="font-medium text-mf-marron-glace"> 2</span>
      </div>
    </div>

    {/* Navigation */}
    <div className="flex gap-3">
      <button
        type="button"
        className="flex-1 px-4 py-3 border-2 border-mf-rose text-mf-rose font-medium rounded-card hover:bg-mf-rose/5"
      >
        ← Retour
      </button>
      <button
        type="submit"
        className="flex-1 px-4 py-3 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose"
      >
        Confirmer réservation
      </button>
    </div>
  </form>
);

/*
  =============================================================================
  SCREEN 5 : CONFIRMATION (Success page)
  =============================================================================
  
  Layout :
  - Icône checkmark (SVG)
  - Messages de succès + email confirmation
  - Recap réservation complet
  - Bouton CTA pour retour accueil
  
  Détails clé :
  - Animation douce au chargement
  - Message explicite que confirmation est en route
  - Mention "vérifiez spam si ne le reçoit pas"
*/

export const ReservationConfirmationScreen = () => (
  <div className="max-w-2xl mx-auto p-6 py-12 text-center">
    {/* Step indicator - complete */}
    <div className="flex gap-2 mb-8 justify-center">
      {[0, 1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 w-8 rounded-full ${s < 4 ? 'bg-mf-rose' : 'bg-mf-poudre'}`}
        />
      ))}
    </div>

    {/* Success icon */}
    <div className="inline-flex items-center justify-center w-16 h-16 bg-mf-rose/10 rounded-full mb-6">
      <svg
        className="w-8 h-8 text-mf-rose"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    </div>

    {/* Title */}
    <h2 className="text-2xl font-serif italic text-mf-marron-glace mb-3">
      Réservation confirmée !
    </h2>

    {/* Email confirmation */}
    <p className="text-mf-muted mb-6">
      Un e-mail de confirmation a été envoyé à{' '}
      <strong className="text-mf-marron-glace">marie@example.com</strong>
    </p>

    {/* Reservation details */}
    <div className="bg-mf-poudre/20 border-2 border-mf-border rounded-card p-6 mb-8 space-y-3 text-left">
      <div className="text-sm">
        <span className="text-mf-muted">Service :</span>
        <span className="font-medium text-mf-marron-glace float-right">Midi 12:00</span>
      </div>
      <div className="border-t border-mf-border pt-3 text-sm">
        <span className="text-mf-muted">Table :</span>
        <span className="font-medium text-mf-marron-glace float-right">7</span>
      </div>
      <div className="border-t border-mf-border pt-3 text-sm">
        <span className="text-mf-muted">Couverts :</span>
        <span className="font-medium text-mf-marron-glace float-right">2</span>
      </div>
      <div className="border-t border-mf-border pt-3 text-sm">
        <span className="text-mf-muted">Date :</span>
        <span className="font-medium text-mf-marron-glace float-right">
          15 mars 2026
        </span>
      </div>
    </div>

    {/* Reassurance message */}
    <p className="text-xs text-mf-muted mb-8 italic">
      Si vous ne recevez pas l'e-mail, vérifiez votre dossier spam ou contactez-nous
      directement.
    </p>

    {/* CTA back to home */}
    <button className="px-8 py-3 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose transition-colors">
      Retour à l'accueil
    </button>
  </div>
);

/*
  =============================================================================
  NOTES DE CONCEPTION (Design Decisions)
  =============================================================================
  
  ✓ Consistency :
    - Utilise charte MF exacte (colors, fonts, spacing)
    - Composants réutilisables (buttons, inputs, cards)
  
  ✓ Mobile first :
    - Responsive grid (cols-3 → cols-4 ou plus sur desktop)
    - Padding/spacing scaling automatique
  
  ✓ Accessibility :
    - Labels explicites pour chaque input
    - Step indicator pour orientation utilisateur
    - Boutons +/− pour party size (plus intuitif que input)
  
  ✓ Performance :
    - Pas de images lourdes (SVG seulement)
    - Forms simples et rapides
  
  ✓ UX Flow :
    Step 0 : Bienvenue (1 clic → commencer)
    Step 1 : Service (midi/soir) + Tour (créneau 30min)
    Step 2 : Plan (sélection table visuelle)
    Step 3 : Info (form + recap)
    Step 4 : Confirmation (success + email recap)
  
  ✓ Email Integration (Resend) :
    - Après submit step 3 → appel fonction serveur qui envoie email
    - Template email : recap + date + qr code réservation (optionnel)
*/
