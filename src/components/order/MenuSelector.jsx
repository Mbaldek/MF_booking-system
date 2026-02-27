const typeLabels = {
  entree: 'Entrée',
  plat: 'Plat',
  dessert: 'Dessert',
  boisson: 'Boisson',
};

export default function MenuSelector({ type, items, selectedId, onSelect, required = false }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-semibold text-gray-700">{typeLabels[type] || type}</p>
        {required ? (
          <span className="text-xs text-red-500 font-medium">obligatoire</span>
        ) : (
          <span className="text-xs text-gray-400">optionnel</span>
        )}
      </div>
      <div className="grid gap-2">
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (required) {
                  // Radio behavior: always select, no deselect
                  onSelect(item.id);
                } else {
                  // Checkbox behavior: toggle
                  onSelect(isSelected ? null : item.id);
                }
              }}
              className={`flex items-start justify-between gap-4 p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-5 h-5 rounded${required ? '-full' : ''} border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
