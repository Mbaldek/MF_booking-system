import { Construction } from 'lucide-react';

export default function AdminPlaceholder({ title, phase = '3-4' }) {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto text-center py-16">
        <Construction className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500">Cette page sera implémentée en Phase {phase}.</p>
      </div>
    </div>
  );
}
