import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEventById } from '@/hooks/useEvents';
import {
  useShifts,
  useTours,
  useFloors,
  useCreateReservation,
} from '@/hooks/useReservation';

function getEventDays(startDate, endDate) {
  const days = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    days.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function formatDay(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatDayLong(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

const BOUTIQUE_URL = 'https://maisonfelicien.com';

export default function ReservationPage() {
  const { eventId } = useParams();

  // step: 0=date+shift+tour, 1=salle préférence, 2=info, 3=confirm
  const [step, setStep] = useState(0);
  const [chosenDate, setChosenDate] = useState(null);
  const [chosenShift, setChosenShift] = useState(null);
  const [chosenTour, setChosenTour] = useState(null);
  const [chosenFloor, setChosenFloor] = useState(null);
  const [guest, setGuest] = useState({ name: '', email: '', seats: 1, phone: '', notes: '' });

  const { data: event } = useEventById(eventId);
  const { data: shifts = [] } = useShifts(eventId);
  const { data: tours = [] } = useTours(chosenShift?.id);
  const { data: floors = [] } = useFloors(eventId);
  const createReservation = useCreateReservation();

  const eventDays = useMemo(() => {
    if (!event?.start_date || !event?.end_date) return [];
    return getEventDays(event.start_date, event.end_date);
  }, [event?.start_date, event?.end_date]);

  // Auto-select single date / shift
  useEffect(() => {
    if (!chosenDate && eventDays.length === 1) setChosenDate(eventDays[0]);
  }, [eventDays, chosenDate]);
  useEffect(() => {
    if (!chosenShift && shifts.length === 1) setChosenShift(shifts[0]);
  }, [shifts, chosenShift]);

  // Auto-select single créneau
  useEffect(() => {
    if (!chosenTour && tours.length === 1) setChosenTour(tours[0]);
  }, [tours, chosenTour]);

  const handleSubmit = () => {
    if (!chosenTour || !guest.name || !guest.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    createReservation.mutate(
      {
        tour_id: chosenTour.id,
        preferred_floor_id: chosenFloor?.id ?? null,
        service_date: chosenDate,
        guest_name: guest.name,
        guest_email: guest.email,
        guest_phone: guest.phone.trim() || null,
        guest_notes: guest.notes.trim() || null,
        seats: guest.seats,
      },
      {
        onSuccess: async () => {
          try {
            await fetch('/api/send-reservation-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'request',
                email: guest.email,
                guestName: guest.name,
                serviceName: chosenShift?.name,
                tourStart: chosenTour?.start_time.slice(0, 5),
                floorName: chosenFloor?.name,
                seats: guest.seats,
                date: chosenDate ? formatDayLong(chosenDate) : new Date().toLocaleDateString('fr-FR'),
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

  const canContinueStep0 = chosenTour && (eventDays.length <= 1 || chosenDate);

  return (
    <div className="min-h-screen bg-mf-blanc-casse">
      <div className="max-w-2xl mx-auto p-6 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div>
              <div className="font-body text-[8px] uppercase tracking-[0.3em] text-mf-vieux-rose">Maison</div>
              <div className="font-serif text-[32px] italic text-mf-rose leading-none">Félicien</div>
            </div>
          </div>
          {event?.name && (
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-mf-vieux-rose mb-1">{event.name}</p>
          )}
          <h1 className="text-2xl font-serif italic text-mf-marron-glace">Réservation de table</h1>
        </div>

        {/* Event editorial content */}
        {step !== 3 && (event?.reservation_image_url || event?.reservation_message) && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-mf-poudre/40">
            {event.reservation_image_url && (
              <img src={event.reservation_image_url} alt={event.name} className="w-full h-48 object-cover" />
            )}
            {event.reservation_message && (
              <p className="px-5 py-4 text-sm text-mf-marron-glace leading-relaxed bg-white">{event.reservation_message}</p>
            )}
          </div>
        )}

        {/* Step indicators */}
        {step !== 3 && (
          <div className="flex gap-2 mb-8 justify-center">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-1.5 w-10 rounded-full transition-colors ${step >= s ? 'bg-mf-rose' : 'bg-mf-poudre/50'}`} />
            ))}
          </div>
        )}

        {/* ── Step 0: Date + Shift + Tour ── */}
        {step === 0 && (
          <div className="space-y-7">
            {/* Jour */}
            {eventDays.length > 1 && (
              <div>
                <h2 className="text-base font-medium text-mf-marron-glace mb-3 uppercase tracking-wide text-[11px] text-mf-vieux-rose">Jour</h2>
                <div className="flex gap-2 flex-wrap">
                  {eventDays.map((d) => (
                    <button key={d} onClick={() => { setChosenDate(d); setChosenShift(null); setChosenTour(null); }}
                      className={`px-4 py-2 border-2 rounded-full text-sm font-medium transition-colors ${
                        chosenDate === d ? 'border-mf-rose bg-mf-rose text-white' : 'border-mf-border text-mf-marron-glace hover:border-mf-rose/60'
                      }`}>
                      {formatDay(d)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service */}
            {(chosenDate || eventDays.length <= 1) && (
              <div>
                <h2 className="text-[11px] uppercase tracking-wide text-mf-vieux-rose mb-3">Service</h2>
                <div className="space-y-2">
                  {shifts.map((s) => (
                    <button key={s.id} onClick={() => { setChosenShift(s); setChosenTour(null); }}
                      className={`w-full text-left px-5 py-3.5 border-2 rounded-2xl transition-colors ${
                        chosenShift?.id === s.id ? 'border-mf-rose bg-mf-rose/5' : 'border-mf-border hover:border-mf-rose/50'
                      }`}>
                      <div className="font-medium text-mf-marron-glace">{s.name}</div>
                      <div className="text-sm text-mf-muted">{s.start_time.slice(0,5)} — {s.end_time.slice(0,5)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Créneau */}
            {chosenShift && tours.length > 1 && (
              <div>
                <h2 className="text-[11px] uppercase tracking-wide text-mf-vieux-rose mb-3">Créneau horaire</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tours.map((t) => (
                    <button key={t.id} onClick={() => setChosenTour(t)}
                      className={`px-4 py-3 border-2 rounded-2xl transition-colors text-center ${
                        chosenTour?.id === t.id ? 'border-mf-rose bg-mf-rose/5' : 'border-mf-border hover:border-mf-rose/50'
                      }`}>
                      <div className="font-medium text-mf-marron-glace">{t.start_time.slice(0,5)}</div>
                      <div className="text-xs text-mf-muted">{t.duration_minutes} min</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Single tour info */}
            {chosenShift && tours.length === 1 && chosenTour && (
              <div className="flex items-center gap-3 px-5 py-3.5 border-2 border-mf-rose/30 bg-mf-rose/5 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-mf-rose" />
                <span className="text-sm text-mf-marron-glace">Créneau unique : <strong>{chosenTour.start_time.slice(0,5)}</strong> ({chosenTour.duration_minutes} min)</span>
              </div>
            )}

            {canContinueStep0 && (
              <button onClick={() => setStep(1)}
                className="w-full px-4 py-3.5 bg-mf-rose text-white font-medium rounded-full hover:bg-mf-vieux-rose transition-colors tracking-wide">
                Continuer →
              </button>
            )}
          </div>
        )}

        {/* ── Step 1: Salle préférence ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-serif italic text-mf-marron-glace mb-1">Préférence de salle</h2>
              <p className="text-sm text-mf-muted mb-5 leading-relaxed">
                Indiquez une salle si vous avez une préférence. Cette demande n'est pas garantie — notre équipe fera au mieux lors de l'attribution.
              </p>

              {floors.length === 0 && (
                <p className="text-sm text-mf-muted italic">Aucune salle configurée pour cet événement.</p>
              )}

              <div className="space-y-2">
                {floors.map((f) => (
                  <button key={f.id} onClick={() => setChosenFloor(chosenFloor?.id === f.id ? null : f)}
                    className={`w-full text-left px-5 py-3.5 border-2 rounded-2xl transition-colors ${
                      chosenFloor?.id === f.id ? 'border-mf-rose bg-mf-rose/5' : 'border-mf-border hover:border-mf-rose/50'
                    }`}>
                    <div className="flex items-center gap-3">
                      {f.image_url && <img src={f.image_url} alt={f.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />}
                      <div>
                        <div className="font-medium text-mf-marron-glace">{f.name}</div>
                        {f.description && <div className="text-sm text-mf-muted">{f.description}</div>}
                      </div>
                      {chosenFloor?.id === f.id && <div className="ml-auto w-2.5 h-2.5 rounded-full bg-mf-rose shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>

              {chosenFloor && (
                <button onClick={() => setChosenFloor(null)} className="mt-3 text-sm text-mf-muted underline underline-offset-2 hover:text-mf-vieux-rose transition-colors">
                  Annuler ma préférence
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 px-4 py-3 border-2 border-mf-rose text-mf-rose font-medium rounded-full hover:bg-mf-rose/5">
                ← Retour
              </button>
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-3 bg-mf-rose text-white font-medium rounded-full hover:bg-mf-vieux-rose transition-colors">
                {chosenFloor ? 'Continuer →' : 'Passer →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Infos invité ── */}
        {step === 2 && (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-mf-vieux-rose mb-2">Votre nom *</label>
              <input type="text" required value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                placeholder="Prénom Nom"
                className="w-full px-5 py-3 border-2 border-mf-border rounded-full focus:outline-none focus:border-mf-rose bg-white text-mf-marron-glace" />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wide text-mf-vieux-rose mb-2">Email *</label>
              <input type="email" required value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full px-5 py-3 border-2 border-mf-border rounded-full focus:outline-none focus:border-mf-rose bg-white text-mf-marron-glace" />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wide text-mf-vieux-rose mb-2">Téléphone</label>
              <input type="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                placeholder="+33 6 00 00 00 00 (optionnel)"
                className="w-full px-5 py-3 border-2 border-mf-border rounded-full focus:outline-none focus:border-mf-rose bg-white text-mf-marron-glace" />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wide text-mf-vieux-rose mb-2">Notes & demandes particulières</label>
              <textarea value={guest.notes} rows={3}
                onChange={(e) => setGuest({ ...guest, notes: e.target.value })}
                placeholder="Allergies, accès PMR, poussette, animal de compagnie…"
                className="w-full px-5 py-3 border-2 border-mf-border rounded-2xl focus:outline-none focus:border-mf-rose bg-white text-mf-marron-glace resize-none text-sm" />
              <p className="text-xs text-mf-muted mt-1.5 px-1 leading-snug">
                Nous ferons notre possible pour vous accommoder. Nous nous excusons par avance si cela n'est pas toujours possible.
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wide text-mf-vieux-rose mb-2">Nombre de couverts</label>
              <div className="flex gap-3 items-center">
                <button type="button" onClick={() => setGuest({ ...guest, seats: Math.max(1, guest.seats - 1) })}
                  className="w-10 h-10 border-2 border-mf-border rounded-full hover:bg-mf-poudre/20 flex items-center justify-center text-mf-marron-glace font-medium">
                  −
                </button>
                <span className="w-8 text-center font-semibold text-xl text-mf-marron-glace">{guest.seats}</span>
                <button type="button" onClick={() => setGuest({ ...guest, seats: Math.min(12, guest.seats + 1) })}
                  className="w-10 h-10 border-2 border-mf-border rounded-full hover:bg-mf-poudre/20 flex items-center justify-center text-mf-marron-glace font-medium">
                  +
                </button>
              </div>
            </div>

            {/* Récap */}
            <div className="bg-mf-poudre/20 border border-mf-poudre rounded-2xl p-5 space-y-2.5">
              {chosenDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-mf-muted">Jour</span>
                  <span className="font-medium text-mf-marron-glace">{formatDay(chosenDate)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-mf-muted">Service</span>
                <span className="font-medium text-mf-marron-glace">{chosenShift?.name} · {chosenTour?.start_time.slice(0,5)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-mf-muted">Salle souhaitée</span>
                <span className="font-medium text-mf-marron-glace">
                  {chosenFloor ? chosenFloor.name : <span className="italic text-mf-muted">Aucune préférence</span>}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-mf-muted">Couverts</span>
                <span className="font-medium text-mf-marron-glace">{guest.seats}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 border-2 border-mf-rose text-mf-rose font-medium rounded-full hover:bg-mf-rose/5">
                ← Retour
              </button>
              <button type="submit" disabled={createReservation.isPending}
                className="flex-1 px-4 py-3.5 bg-mf-rose text-white font-medium rounded-full hover:bg-mf-vieux-rose disabled:opacity-50 transition-colors tracking-wide">
                {createReservation.isPending ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Confirmation + boutique ── */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Success card */}
            <div className="bg-white rounded-2xl border border-mf-poudre/40 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-mf-rose/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-9 h-9 text-mf-rose" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-serif italic text-mf-rose mb-2">Demande enregistrée !</h2>
                <p className="text-mf-muted text-sm leading-relaxed mb-1">
                  Merci <strong className="text-mf-marron-glace">{guest.name}</strong>. Votre demande a bien été reçue.
                </p>
              </div>

              {/* Récap compact */}
              <div className="bg-mf-blanc-casse rounded-xl px-5 py-4 text-left space-y-2">
                {chosenDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mf-muted">Jour</span>
                    <span className="font-medium text-mf-marron-glace">{formatDay(chosenDate)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-mf-muted">Service</span>
                  <span className="font-medium text-mf-marron-glace">{chosenShift?.name} · {chosenTour?.start_time.slice(0,5)}</span>
                </div>
                {chosenFloor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mf-muted">Salle souhaitée</span>
                    <span className="font-medium text-mf-marron-glace">{chosenFloor.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-mf-muted">Couverts</span>
                  <span className="font-medium text-mf-marron-glace">{guest.seats}</span>
                </div>
              </div>

              <p className="text-xs text-mf-muted leading-relaxed">
                Un email de confirmation vous sera envoyé à <strong>{guest.email}</strong> dès que notre équipe aura attribué votre table.
              </p>
            </div>

            {/* Boutique promo card */}
            <div className="bg-mf-marron-glace rounded-2xl overflow-hidden">
              <div className="px-8 py-7 text-center space-y-4">
                <div className="flex justify-center">
                  <div>
                    <div className="font-body text-[8px] uppercase tracking-[0.3em] text-mf-poudre opacity-70">Maison</div>
                    <div className="font-serif text-[24px] italic text-mf-poudre leading-none">Félicien</div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-mf-poudre/60 mb-2">Découvrez notre boutique</p>
                  <p className="text-mf-poudre text-base leading-relaxed">
                    Foie gras, terrines maison, conserves & épicerie fine — tout l'art de vivre Maison Félicien, livré chez vous.
                  </p>
                </div>
                <a href={BOUTIQUE_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-mf-rose text-white text-sm font-medium rounded-full hover:bg-mf-vieux-rose transition-colors tracking-wide">
                  Visiter la boutique
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Secondary link */}
            <p className="text-center text-sm text-mf-muted">
              Vous avez une autre question ?{' '}
              <a href="mailto:contact@maisonfelicien.com" className="text-mf-rose hover:underline">
                Contactez-nous
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
