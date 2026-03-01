import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventById } from '@/hooks/useEvents';
import {
  useShifts,
  useTours,
  useFloors,
  useTables,
  useCreateReservation,
} from '@/hooks/useReservation';

export default function ReservationPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // step state: 0 choose shift/tour, 1 choose table, 2 info, 3 confirm
  const [step, setStep] = useState(0);
  const [chosenShift, setChosenShift] = useState(null);
  const [chosenTour, setChosenTour] = useState(null);
  const [chosenTable, setChosenTable] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [guest, setGuest] = useState({ name: '', email: '', seats: 1 });

  // queries
  const { data: event } = useEventById(eventId);
  const { data: shifts = [] } = useShifts(eventId);
  const { data: tours = [] } = useTours(chosenShift?.id);
  const { data: floors = [] } = useFloors(eventId);
  const { data: tables = [] } = useTables(selectedFloor?.id);
  const createReservation = useCreateReservation();

  // pick first floor when they load
  useEffect(() => {
    if (floors.length && !selectedFloor) {
      setSelectedFloor(floors[0]);
    }
  }, [floors, selectedFloor]);

  const handleSubmit = () => {
    if (!chosenTour || !guest.name || !guest.email) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    createReservation.mutate(
      {
        tour_id: chosenTour.id,
        table_id: chosenTable?.id,
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
                tableNumber: chosenTable?.number,
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
                  onClick={() => setChosenShift(s)}
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
                    onClick={() => { setChosenTour(t); setStep(1); }}
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

      {/* Step 1: Choose Table */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-mf-marron-glace">Plan de salle</h2>

          {/* Floor selector if multiple floors */}
          {floors.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {floors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFloor(f)}
                  className={`px-3 py-1.5 border-2 rounded-card text-sm transition-colors ${
                    selectedFloor?.id === f.id
                      ? 'border-mf-rose bg-mf-rose/5 text-mf-rose'
                      : 'border-mf-border text-mf-muted hover:border-mf-rose/50'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Floor info (description + image) */}
          {selectedFloor && (selectedFloor.image_url || selectedFloor.description) && (
            <div className="rounded-card overflow-hidden border border-mf-border">
              {selectedFloor.image_url && (
                <img src={selectedFloor.image_url} alt={selectedFloor.name} className="w-full h-32 object-cover" />
              )}
              {selectedFloor.description && (
                <p className="px-4 py-3 text-sm text-mf-marron-glace leading-relaxed">{selectedFloor.description}</p>
              )}
            </div>
          )}

          {/* Table grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setChosenTable(t)}
                className={`px-3 py-4 border-2 rounded-card transition-colors text-center ${
                  chosenTable?.id === t.id
                    ? 'border-mf-rose bg-mf-rose/5'
                    : 'border-mf-border hover:border-mf-rose/50'
                }`}
              >
                <div className="font-medium text-mf-marron-glace">T{t.number}</div>
                <div className="text-xs text-mf-muted">{t.seats} pers.</div>
              </button>
            ))}
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
              disabled={!chosenTable}
              className="flex-1 px-4 py-2 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose disabled:opacity-50 transition-colors"
            >
              Continuer →
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
              <span className="text-mf-muted">Service :</span> <span className="font-medium text-mf-marron-glace">{chosenShift?.name} {chosenTour?.start_time.slice(0,5)}</span>
            </div>
            <div className="text-sm">
              <span className="text-mf-muted">Table :</span> <span className="font-medium text-mf-marron-glace">T{chosenTable?.number}</span>
            </div>
            <div className="text-sm">
              <span className="text-mf-muted">Couverts :</span> <span className="font-medium text-mf-marron-glace">{guest.seats}</span>
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
              className="flex-1 px-4 py-3 bg-mf-rose text-white font-medium rounded-card hover:bg-mf-vieux-rose transition-colors"
            >
              Confirmer réservation
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
            <h2 className="text-xl font-serif italic text-mf-marron-glace mb-2">Réservation confirmée !</h2>
            <p className="text-mf-muted mb-4">
              Un e-mail de confirmation a été envoyé à <strong>{guest.email}</strong>.
            </p>
            <p className="text-sm text-mf-muted mb-6">
              Table {chosenTable?.number} • {chosenShift?.name} à {chosenTour?.start_time.slice(0,5)} • {guest.seats} couverts
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
