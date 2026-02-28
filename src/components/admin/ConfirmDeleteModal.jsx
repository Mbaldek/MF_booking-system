import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Double-validation deletion modal.
 * User must type `confirmText` exactly to enable the delete button.
 *
 * @param {string}   title        — Modal heading
 * @param {string}   description  — Warning message
 * @param {string}   confirmText  — Text the user must type to confirm (case-insensitive)
 * @param {string}   [confirmLabel='Supprimer'] — Delete button label
 * @param {function} onConfirm    — Called when user confirms
 * @param {function} onCancel     — Called when user cancels
 * @param {boolean}  loading      — Show spinner on confirm button
 */
export default function ConfirmDeleteModal({
  title,
  description,
  confirmText,
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const [typed, setTyped] = useState('');
  const isMatch = typed.trim().toLowerCase() === confirmText.trim().toLowerCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600">{description}</p>

        {/* Confirmation input */}
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500">
            Tapez <span className="font-mono font-semibold text-gray-900">{confirmText}</span> pour confirmer :
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            placeholder={confirmText}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isMatch || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Suppression...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
