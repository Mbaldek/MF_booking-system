const typeLabels = {
  entree: 'Entrée',
  plat: 'Plat',
  dessert: 'Dessert',
  boisson: 'Boisson',
};

export default function MenuSelector({ type, items, selectedId, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{typeLabels[type] || type}</p>
      <div className="grid gap-2">
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : item.id)}
              className={`flex items-start justify-between gap-4 p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                {Number(item.price).toFixed(2)}€
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
