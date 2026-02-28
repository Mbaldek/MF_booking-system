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
        <p className="text-[11px] uppercase tracking-[0.18em] text-mf-vieux-rose font-medium">{typeLabels[type] || type}</p>
        {required ? (
          <span className="text-[10px] text-mf-rose font-medium">obligatoire</span>
        ) : (
          <span className="text-[10px] text-mf-muted-light">optionnel</span>
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
                  onSelect(item.id);
                } else {
                  onSelect(isSelected ? null : item.id);
                }
              }}
              className={`flex items-start justify-between gap-4 p-3 rounded-2xl border-[1.5px] transition-all text-left cursor-pointer ${
                isSelected
                  ? 'border-mf-rose bg-mf-poudre/15'
                  : 'border-mf-border hover:border-mf-vieux-rose/40'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-5 h-5 rounded${required ? '-full' : ''} border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'bg-mf-rose border-mf-rose' : 'border-mf-border'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`font-medium text-sm ${isSelected ? 'text-mf-rose' : 'text-mf-marron-glace'}`}>{item.name}</span>
                  {item.description && (
                    <p className="text-xs text-mf-muted mt-0.5">{item.description}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-mf-vert-olive/10 text-mf-vert-olive"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
