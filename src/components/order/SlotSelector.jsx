import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const slotLabels = { midi: 'Midi', soir: 'Soir' };

export default function SlotSelector({ slots, selectedSlotIds, onToggleSlot }) {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = slot.slot_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Sélectionnez vos créneaux</h3>
      <div className="grid gap-3">
        {Object.entries(slotsByDate).map(([date, dateSlots]) => (
          <div key={date} className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {format(new Date(date + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {dateSlots.map((slot) => {
                const isSelected = selectedSlotIds.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onToggleSlot(slot.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-[#8B3A43] bg-[#8B3A43]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-[#8B3A43] border-[#8B3A43]' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-sm">
                      {slotLabels[slot.slot_type] || slot.slot_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
