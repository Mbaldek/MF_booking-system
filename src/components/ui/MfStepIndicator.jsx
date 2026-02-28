import { Check } from 'lucide-react';

export default function MfStepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const completed = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-body transition-all duration-300 ${
                  completed
                    ? 'bg-mf-rose text-white'
                    : active
                      ? 'bg-mf-poudre/40 border-2 border-mf-rose text-mf-rose'
                      : 'bg-mf-blanc-casse border border-mf-border text-mf-muted'
                }`}
              >
                {completed ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[9px] uppercase tracking-[0.1em] font-body ${
                  completed || active ? 'text-mf-rose' : 'text-mf-muted'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div
                className={`w-10 h-[1.5px] mx-1 mt-[-14px] transition-colors duration-300 ${
                  i < current ? 'bg-mf-rose' : 'bg-mf-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
