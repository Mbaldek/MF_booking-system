import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabase';
import MfButton from '@/components/ui/MfButton';

const RATINGS = [
  { value: 1, emoji: '😍', label: 'Excellent' },
  { value: 2, emoji: '😊', label: 'Bien' },
  { value: 3, emoji: '😐', label: 'Moyen' },
  { value: 4, emoji: '😞', label: 'Décevant' },
];

export default function FeedbackPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const initialRating = Number(params.get('rating')) || null;

  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | duplicate | error
  const [autoSaved, setAutoSaved] = useState(false);

  // Auto-submit rating from URL on mount
  useEffect(() => {
    if (!orderId || !initialRating || autoSaved) return;
    setAutoSaved(true);
    submitFeedback(initialRating, '');
  }, [orderId, initialRating]);

  async function submitFeedback(r, c) {
    if (!orderId || !r) return;
    setStatus('saving');
    const { error } = await supabase
      .from('order_feedback')
      .upsert({ order_id: orderId, rating: r, comment: c || null }, { onConflict: 'order_id' });

    if (error) {
      if (error.code === '23505') {
        setStatus('duplicate');
      } else {
        console.error(error);
        setStatus('error');
      }
    } else {
      setStatus('saved');
    }
  }

  function handleSubmitComment() {
    submitFeedback(rating, comment);
  }

  function handleChangeRating(value) {
    setRating(value);
    if (status === 'saved' || status === 'duplicate') {
      // Re-submit with new rating
      setStatus('idle');
      submitFeedback(value, comment);
    }
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-mf-border text-center">
          <p className="font-body text-mf-muted text-sm">Lien invalide — identifiant de commande manquant.</p>
        </div>
      </div>
    );
  }

  const current = RATINGS.find((r) => r.value === rating);

  return (
    <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-mf-border">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img src="/brand/Symbole-Rose.svg" alt="" className="h-12 w-auto opacity-60" />
        </div>

        {/* Title */}
        <h1 className="font-display italic text-2xl text-mf-rose text-center mb-6">
          Merci pour votre retour !
        </h1>

        {status === 'duplicate' ? (
          <div className="text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-body text-mf-rose text-sm">
              Vous avez déjà donné votre avis, merci !
            </p>
          </div>
        ) : status === 'saved' ? (
          <div className="text-center space-y-4">
            {/* Big emoji */}
            {current && (
              <div className="space-y-1">
                <div className="text-[64px] leading-none">{current.emoji}</div>
                <div className="font-body text-sm text-mf-muted">{current.label}</div>
              </div>
            )}

            {/* Emoji selector to change */}
            <div className="flex justify-center gap-3 mt-4">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleChangeRating(r.value)}
                  className={`text-3xl p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-transparent ${
                    r.value === rating
                      ? 'border-mf-rose scale-110'
                      : 'border-transparent hover:border-mf-poudre'
                  }`}
                >
                  {r.emoji}
                </button>
              ))}
            </div>

            {/* Comment area */}
            <div className="mt-5 space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Un commentaire ?"
                rows={3}
                className="w-full rounded-2xl border border-mf-border px-4 py-3 font-body text-sm text-mf-marron-glace placeholder:text-mf-muted/50 focus:outline-none focus:border-mf-rose/40 resize-none"
              />
              {comment.trim() && (
                <MfButton onClick={handleSubmitComment} fullWidth>
                  Envoyer
                </MfButton>
              )}
            </div>

            {/* Confirmation */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-status-green text-lg">✓</span>
              <span className="font-body text-sm text-mf-rose">Votre avis compte, merci !</span>
            </div>
          </div>
        ) : (
          /* Initial state or loading */
          <div className="text-center space-y-4">
            {status === 'saving' && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mf-rose" />
              </div>
            )}

            {status === 'error' && (
              <p className="font-body text-sm text-red-500">Une erreur est survenue. Réessayez.</p>
            )}

            {status === 'idle' && (
              <>
                <p className="font-body text-sm text-mf-muted mb-4">
                  Comment s'est passé votre repas ?
                </p>
                <div className="flex justify-center gap-3">
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleChangeRating(r.value)}
                      className={`flex flex-col items-center gap-1 text-3xl p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-transparent ${
                        r.value === rating
                          ? 'border-mf-rose scale-110'
                          : 'border-transparent hover:border-mf-poudre'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span className="text-[10px] font-body text-mf-muted">{r.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
