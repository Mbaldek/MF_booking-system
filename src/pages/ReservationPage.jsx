import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventById } from '@/hooks/useEvents';
import {
  useShifts,
  useTours,
  useFloors,
  useCreateReservation,
} from '@/hooks/useReservation';

export default function ReservationPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // step: 0=shift/tour, 1=salle préférence, 2=info, 3=confirm
  const [step, setStep] = useState(0);
  const [chosenShift, setChosenShift] = useState(null);
  const [chosenTour, setChosenTour] = useState(null);
  const [chosenFloor, setChosenFloor] = useState(null); // optional preference
  const [guest, setGuest] = useState({ name: '', email: '', seats: 1 });

  const { data: event } = useEventById(eventId);
  const { data: shifts = [] } = useShifts(eventId);
  const { data: tours = [] } = useTours(chosenShift?.id);
  const { data: floors = [] } = useFloors(eventId);
  const createReservation = useCreateReservation();

  const handleSubmit = () => {
    if (!chosenTour || !guest.name || !guest.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    createReservation.mutate(
      {
        tour_id: chosenTour.id,
        preferred_floor_id: chosenFloor?.id ?? null,
        guest_name: guest.name,
        guest_email: guest.email,
        seats: guest.seats,
      },
      {
        onSuccess: async () => {
          try {
            await fetch('/api/send-reservation-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: guest.email,
                guestName: guest.name,
                serviceName: chosenShift?.name,
                tourStart: chosenTour?.start_time.slice(0, 5),
                floorName: chosenFloor?.name,
                seats: guest.seats,
                date: new Date().toLocaleDateString('fr-FR'),
              }),
            });
          } catch (err) {
            console.error('Email error:', err);
          }
          setStep(3);
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div>
            <div className="font-body text-[8px] uppercase tracking-[0.3em] text-mf-vieux-rose">Maison</div>
            <div className="font-serif text-[28px] italic text-mf-rose leading-none">Félicien</div>
          </div>
        </div>
        {event?.name && (
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-mf-vieux-rose mb-1">{event.name}</p>
        )}
        <h1 className="text-xl md:text-2xl font-serif italic text-mf-marron-glace">Réservation</h1>
      </div>

      {/* Event editorial content */}
      {(event?.reservation_image_url || event?.reservation_message) && (
        <div className="mb-8 rounded-card overflow-hidden border border-mf-border">
          {event.reservation_image_url && (
            <img src={event.reservation_image_url} alt={event.name} className="w-full h-48 object-cover" />
          )}
          {event.reservation_message && (
            <p className="px-5 py-4 text-sm text-mf-marron-glace leading-relaxed">{event.reservation_message}</p>
          )}
        </div>
      )}

      {/* Step indicators */}
      <div className="flex gap-2 mb-8 justify-center">
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className={`h-2 w-8 rounded-full ${step >= s ? 'bg-mf-rose' : 'bg-mf-poudre'}`} />
        ))}
      </div>

      {/* Step 0: Choose Shift & Tour */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-mf-marron-glace mb-3">Choisissez un service</h2>
            <div className="space-y-2">
              {shifts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setChosenShift(s); setChosenTour(null); }}
                  className={`w-full text-left px-4 py-3 border-2 rounded-card transition-colors ${
                    chosenShift?.id === s.id
                      ? 'border-mf-rose bg-mf-rose/5'
                      : 'border-mf-border hover:border-mf-rose/50'
                  }`}
                >
                  <div className="font-medium text-mf-marron-glace">{s.name}</div>
                  <div className="text-sm text-mf-muted">{s.start_time.slice(0,5)} — {s.end_time.slice(0,5)}</div>
                </button>
              ))}
            </div>
          </div>

          {chosenShift && tours.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-mf-marron-glace mb-3">Choisissez un créneau horaire</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tours.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setChosenTour(t)}
                    className={`px-4 py-3 border-2 rounded-card transition-colors text-center ${
                      chosenTour?.id === t.id
                        ? 'border-mf-rose bg-mf-rose/5'
                        : 'border-mf-border hover:border-mf-rose/50'
                    }`}
                  >
                    <div className="font-medium text-mf-marron-glace">{t.start_time.slice(0,5)}</div>
                    <div className="text-xs text-mf-muted">{t.duration_minutes} min</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chosenTour && (
            <button
              onClick={() => setStep(1)}
              className="w-full px-4 py-3 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose transition-colors"
            >
              Continuer →
            </button>
          )}
        </div>
      )}

      {/* Step 1: Salle preference (optional) */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-mf-marron-glace mb-1">Préférence de salle</h2>
            <p className="text-sm text-mf-muted mb-4">
              Indiquez une salle si vous avez une préférence. Cette demande n'est pas garantie — notre équipe fera au mieux lors de l'attribution des tables.
            </p>

            {floors.length === 0 && (
              <p className="text-sm text-mf-muted italic">Aucune salle configurée pour cet événement.</p>
            )}

            <div className="space-y-2">
              {floors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChosenFloor(chosenFloor?.id === f.id ? null : f)}
                  className={`w-full text-left px-4 py-3 border-2 rounded-card transition-colors ${
                    chosenFloor?.id === f.id
                      ? 'border-mf-rose bg-mf-rose/5'
                      : 'border-mf-border hover:border-mf-rose/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {f.image_url && (
                      <img src={f.image_url} alt={f.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-mf-marron-glace">{f.name}</div>
                      {f.description && <div className="text-sm text-mf-muted">{f.description}</div>}
                    </div>
                    {chosenFloor?.id === f.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-mf-rose" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {chosenFloor && (
              <button
                onClick={() => setChosenFloor(null)}
                className="mt-2 text-sm text-mf-muted underline underline-offset-2 hover:text-mf-vieux-rose transition-colors"
              >
                Annuler ma préférence
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 px-4 py-2 border-2 border-mf-rose text-mf-rose font-medium rounded-card hover:bg-mf-rose/5"
            >
              ← Retour
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-4 py-2 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose transition-colors"
            >
              {chosenFloor ? 'Continuer →' : 'Passer →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Guest Info */}
      {step === 2 && (
        <form
          className="space-y-6"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        >
          <div>
            <label className="block text-sm font-medium text-mf-marron-glace mb-2">Votre nom *</label>
            <input
              type="text"
              required
              value={guest.name}
              onChange={(e) => setGuest({ ...guest, name: e.target.value })}
              placeholder="Prénom Nom"
              className="w-full px-4 py-2 border-2 border-mf-border rounded-card focus:outline-none focus:border-mf-rose"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mf-marron-glace mb-2">Votre email *</label>
            <input
              type="email"
              required
              value={guest.email}
              onChange={(e) => setGuest({ ...guest, email: e.target.value })}
              placeholder="contact@example.com"
              className="w-full px-4 py-2 border-2 border-mf-border rounded-card focus:outline-none focus:border-mf-rose"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mf-marron-glace mb-2">Nombre de couverts</label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setGuest({ ...guest, seats: Math.max(1, guest.seats - 1) })}
                className="px-3 py-2 border-2 border-mf-border rounded-card hover:bg-mf-poudre/20"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={12}
                value={guest.seats}
                onChange={(e) => setGuest({ ...guest, seats: Math.max(1, parseInt(e.target.value, 10)) })}
                className="w-16 text-center px-2 py-2 border-2 border-mf-border rounded-card focus:outline-none focus:border-mf-rose"
              />
              <button
                type="button"
                onClick={() => setGuest({ ...guest, seats: guest.seats + 1 })}
                className="px-3 py-2 border-2 border-mf-border rounded-card hover:bg-mf-poudre/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-mf-poudre/20 border-2 border-mf-border rounded-card p-4 space-y-2">
            <div className="text-sm">
              <span className="text-mf-muted">Service :</span>{' '}
              <span className="font-medium text-mf-marron-glace">{chosenShift?.name} à {chosenTour?.start_time.slice(0,5)}</span>
            </div>
            <div className="text-sm">
              <span className="text-mf-muted">Salle souhaitée :</span>{' '}
              <span className="font-medium text-mf-marron-glace">
                {chosenFloor ? chosenFloor.name : <span className="italic text-mf-muted">Aucune préférence</span>}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-mf-muted">Couverts :</span>{' '}
              <span className="font-medium text-mf-marron-glace">{guest.seats}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-3 border-2 border-mf-rose text-mf-rose font-medium rounded-card hover:bg-mf-rose/5"
            >
              ← Retour
            </button>
            <button
              type="submit"
              disabled={createReservation.isPending}
              className="flex-1 px-4 py-3 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose disabled:opacity-50 transition-colors"
            >
              {createReservation.isPending ? 'Envoi…' : 'Confirmer la réservation'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-mf-rose/10 rounded-full">
            <svg className="w-8 h-8 text-mf-rose" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-serif italic text-mf-marron-glace mb-2">Demande enregistrée !</h2>
            <p className="text-mf-muted mb-2">
              Merci <strong>{guest.name}</strong>. Votre demande de réservation a bien été reçue.
            </p>
            <p className="text-sm text-mf-muted mb-2">
              {chosenShift?.name} à {chosenTour?.start_time.slice(0,5)}
              {chosenFloor && ` — salle préférée : ${chosenFloor.name}`}
              {' '}• {guest.seats} couvert{guest.seats > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-mf-muted mb-6">
              Notre équipe vous attribuera une table et vous confirmera votre réservation par e-mail à <strong>{guest.email}</strong>.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      )}
    </div>
  );
}
