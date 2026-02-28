import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const slotLabels = { midi: 'Midi', soir: 'Soir' };

export default function SlotSelector({ slots, selectedSlotIds, onToggleSlot, slotCounts = {} }) {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = slot.slot_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.12em] font-medium text-[#8B3A43]">Sélectionnez vos créneaux</h3>
      <div className="grid gap-3">
        {Object.entries(slotsByDate).map(([date, dateSlots]) => (
          <div key={date} className="space-y-2">
            <p className="text-sm font-semibold text-[#392D31] capitalize">
              {format(new Date(date + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {dateSlots.map((slot) => {
                const isSelected = selectedSlotIds.includes(slot.id);
                const currentCount = slotCounts[slot.id] || 0;
                const isFull = slot.max_orders != null && currentCount >= slot.max_orders;
                const isDisabled = isFull && !isSelected;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => !isDisabled && onToggleSlot(slot.id)}
                    disabled={isDisabled}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-[1.5px] transition-all text-left ${
                      isDisabled
                        ? 'border-[#E5D9D0] bg-[#F0F0E6] opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-[#8B3A43] bg-[#E5B7B3]/15'
                          : 'border-[#E5D9D0] hover:border-[#BF646D]/40'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isDisabled
                          ? 'border-[#E5D9D0] bg-[#F0F0E6]'
                          : isSelected ? 'bg-[#8B3A43] border-[#8B3A43]' : 'border-[#E5D9D0]'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`font-medium text-sm ${isDisabled ? 'text-[#C4B5A8]' : 'text-[#392D31]'}`}>
                      {slotLabels[slot.slot_type] || slot.slot_type}
                    </span>
                    {isFull && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#8B3A43]/10 text-[#8B3A43]">
                        Complet
                      </span>
                    )}
                    {!isFull && slot.max_orders != null && (
                      <span className="ml-auto text-[10px] text-[#C4B5A8]">
                        {slot.max_orders - currentCount} place{slot.max_orders - currentCount > 1 ? 's' : ''}
                      </span>
                    )}
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
