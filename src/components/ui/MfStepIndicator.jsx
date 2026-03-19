import { Check } from 'lucide-react';

export default function MfStepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((label, i) => {
        const completed = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
              {/* Number or check */}
              <div
                className="flex items-center justify-center font-display"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  fontSize: 14,
                  border: completed
                    ? '1.5px solid #8B3A43'
                    : active
                      ? '1.5px solid #8B3A43'
                      : '1px solid rgba(57,45,49,0.12)',
                  background: completed ? '#8B3A43' : 'transparent',
                  color: completed
                    ? '#F0F0E6'
                    : active
                      ? '#8B3A43'
                      : 'rgba(57,45,49,0.2)',
                  transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {completed ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {/* Label */}
              <span
                className="font-body text-[8px] uppercase mt-1.5"
                style={{
                  letterSpacing: '0.18em',
                  color: completed || active ? '#8B3A43' : 'rgba(57,45,49,0.2)',
                  transition: 'color 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="mx-1"
                style={{
                  width: 28,
                  height: 1,
                  marginTop: -14,
                  background: i < current
                    ? '#8B3A43'
                    : 'rgba(57,45,49,0.1)',
                  transition: 'background 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
