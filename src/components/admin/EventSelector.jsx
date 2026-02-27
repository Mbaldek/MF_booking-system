import { useEvents, useActiveEvent } from '@/hooks/useEvents';

export default function EventSelector({ selectedEventId, onEventChange }) {
  const { data: events = [], isLoading } = useEvents();
  const { data: activeEvent } = useActiveEvent();

  const effectiveId = selectedEventId ?? activeEvent?.id ?? '';

  if (isLoading) {
    return <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-lg" />;
  }

  if (events.length === 0) {
    return <p className="text-sm text-gray-400">Aucun événement</p>;
  }

  return (
    <select
      value={effectiveId}
      onChange={(e) => onEventChange(e.target.value || null)}
      className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium outline-none focus:border-[#8B3A43] focus:ring-2 focus:ring-[#8B3A43]/20"
    >
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.name}{ev.id === activeEvent?.id ? ' (actif)' : ''}
        </option>
      ))}
    </select>
  );
}
