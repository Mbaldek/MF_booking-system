import { useEvents, useActiveEvent } from '@/hooks/useEvents';

export default function EventSelector({ selectedEventId, onEventChange }) {
  const { data: events = [], isLoading } = useEvents();
  const { data: activeEvent } = useActiveEvent();

  const effectiveId = selectedEventId ?? activeEvent?.id ?? '';

  if (isLoading) {
    return <div className="h-10 w-40 bg-mf-blanc-casse animate-pulse rounded-pill" />;
  }

  if (events.length === 0) {
    return <p className="font-body text-[12px] text-mf-muted">Aucun événement</p>;
  }

  return (
    <select
      value={effectiveId}
      onChange={(e) => onEventChange(e.target.value || null)}
      className="px-4 py-2 border border-mf-border bg-mf-white rounded-pill font-body text-[12px] text-mf-marron-glace outline-none focus:border-mf-rose cursor-pointer"
    >
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.name}{ev.id === activeEvent?.id ? ' (actif)' : ''}
        </option>
      ))}
    </select>
  );
}
