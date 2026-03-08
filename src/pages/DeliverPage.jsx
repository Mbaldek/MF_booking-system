import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/api/supabase';

const SLOT_LABEL = { midi: '☀ Midi', soir: '☽ Soir' };
const TYPE_EMOJI = { entree: '🥗', plat: '🍽', dessert: '🍰', boisson: '🥂' };

export default function DeliverPage() {
  const { orderId } = useParams();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [lines, setLines] = useState([]);
  const [notFound, setNotFound] = useState(false);

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState(null);

  /* ── Load order + lines ── */
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const { data: o, error: oErr } = await supabase
        .from('orders')
        .select('*, event:events(name)')
        .eq('id', orderId)
        .single();

      if (oErr || !o) { setNotFound(true); setLoading(false); return; }
      setOrder(o);

      const { data: l } = await supabase
        .from('order_lines')
        .select('*, meal_slot:meal_slots(slot_date, slot_type), menu_item:menu_items(name, type, tags)')
        .eq('order_id', orderId);

      setLines(l ?? []);
      setLoading(false);
    })();
  }, [orderId]);

  /* ── Auto-open camera after 500ms ── */
  useEffect(() => {
    if (loading || notFound || order?.delivered_at) return;
    const t = setTimeout(() => fileRef.current?.click(), 500);
    return () => clearTimeout(t);
  }, [loading, notFound, order?.delivered_at]);

  /* ── Photo handler ── */
  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  /* ── Confirm delivery ── */
  async function handleConfirm() {
    if (!photo || submitting) return;
    setSubmitting(true);

    try {
      // 1. Upload photo
      const ext = photo.name?.split('.').pop() || 'jpg';
      const path = `${orderId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('delivery-photos')
        .upload(path, photo);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(path);
      const photoUrl = urlData.publicUrl;

      // 2. Update order
      const now = new Date().toISOString();
      await supabase
        .from('orders')
        .update({ delivery_photo_url: photoUrl, delivered_at: now })
        .eq('id', orderId);

      // 3. Update all order_lines to delivered
      await supabase
        .from('order_lines')
        .update({ prep_status: 'delivered', delivered_at: now })
        .eq('order_id', orderId);

      // 4. Send delivery confirmation email (best-effort)
      supabase.functions.invoke('send-delivery-confirmation', { body: { orderId } })
        .catch(() => {});

      setConfirmedAt(now);
      setDone(true);
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center">
        <div className="animate-pulse text-mf-rose font-display italic text-2xl">Maison Félicien</div>
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-mf-border p-8 max-w-sm w-full text-center space-y-3">
          <div className="text-4xl">❌</div>
          <h1 className="font-display text-xl italic text-mf-rose">Commande introuvable</h1>
          <p className="font-body text-sm text-mf-muted">Ce QR code ne correspond à aucune commande.</p>
        </div>
      </div>
    );
  }

  /* ── Already delivered ── */
  if (order.delivered_at && !done) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-mf-border p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-status-green/12 flex items-center justify-center mx-auto">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="font-display text-xl italic text-mf-rose">Déjà livrée</h1>
          <p className="font-body text-sm text-mf-muted">
            Stand <span className="font-medium text-mf-marron-glace">{order.stand || '—'}</span>
          </p>
          <p className="font-body text-xs text-mf-muted">
            {new Date(order.delivered_at).toLocaleString('fr-FR')}
          </p>
          {order.delivery_photo_url && (
            <img src={order.delivery_photo_url} alt="Preuve" className="w-full rounded-xl" />
          )}
        </div>
      </div>
    );
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-mf-border p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-status-green/12 flex items-center justify-center mx-auto">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="font-display text-2xl italic text-mf-rose">Livraison confirmée</h1>
          <p className="font-body text-lg font-medium text-mf-marron-glace">
            Stand {order.stand || '—'}
          </p>
          <p className="font-body text-sm text-mf-muted">
            {confirmedAt && new Date(confirmedAt).toLocaleString('fr-FR')}
          </p>
          <button
            onClick={() => window.close()}
            className="w-full min-h-[48px] rounded-pill bg-mf-rose text-white font-body text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer border-none hover:opacity-90"
          >
            Livraison suivante
          </button>
        </div>
      </div>
    );
  }

  /* ── Delivery info ── */
  const slotTypes = [...new Set(lines.map((l) => l.meal_slot?.slot_type).filter(Boolean))];
  const allergenes = lines.flatMap((l) => l.menu_item?.tags ?? []).filter((t) => t && t !== 'végétarien');
  const hasAllergenes = allergenes.length > 0;

  return (
    <div className="min-h-screen bg-mf-blanc-casse">
      {/* Header */}
      <div className="bg-mf-rose text-white px-5 py-6">
        <p className="font-body text-[10px] uppercase tracking-[0.2em] opacity-80">🚚 Livraison</p>
        <p className="font-body text-[48px] font-bold leading-none mt-1">
          {order.stand || 'Sans stand'}
        </p>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Order info card */}
        <div className="bg-white rounded-2xl border border-mf-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-base font-medium text-mf-marron-glace">
                {order.customer_first_name} {order.customer_last_name}
              </p>
              <p className="font-body text-xs text-mf-muted">{order.order_number}</p>
            </div>
            <div className="flex gap-1.5">
              {slotTypes.map((t) => (
                <span key={t} className="inline-block px-3 py-1 rounded-pill bg-mf-poudre/30 font-body text-xs font-medium text-mf-rose">
                  {SLOT_LABEL[t] || t}
                </span>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-wrap gap-2">
            {lines.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill bg-mf-blanc-casse font-body text-xs text-mf-marron-glace"
              >
                {TYPE_EMOJI[l.menu_item?.type] || '🍽'} {l.menu_item?.name || '—'}
              </span>
            ))}
          </div>

          {/* Allergenes warning */}
          {hasAllergenes && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-orange/10 border border-status-orange/20">
              <span className="text-lg">⚠</span>
              <p className="font-body text-xs text-status-orange font-medium">
                Allergènes : {[...new Set(allergenes)].join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Photo zone */}
        <div className="bg-white rounded-2xl border border-mf-border p-5 space-y-3">
          <p className="font-body text-[10px] uppercase tracking-[0.15em] text-mf-vieux-rose">
            Photo de preuve
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />

          {!photoPreview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-mf-poudre bg-mf-poudre/10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-mf-poudre/20"
            >
              <span className="text-3xl">📷</span>
              <span className="font-body text-sm text-mf-vieux-rose font-medium">Prendre la photo</span>
            </button>
          ) : (
            <div className="space-y-2">
              <img src={photoPreview} alt="Preview" className="w-full rounded-xl" />
              <button
                onClick={() => { setPhoto(null); setPhotoPreview(null); fileRef.current?.click(); }}
                className="w-full min-h-[48px] rounded-pill border border-mf-border bg-white font-body text-sm text-mf-muted hover:text-mf-marron-glace transition-all duration-200 cursor-pointer"
              >
                ↺ Reprendre
              </button>
            </div>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!photo || submitting}
          className="w-full min-h-[56px] rounded-pill bg-status-green text-white font-body text-base uppercase tracking-wider font-medium disabled:opacity-40 transition-all duration-200 cursor-pointer border-none hover:opacity-90 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Envoi en cours…
            </>
          ) : (
            '✓ Confirmer la livraison'
          )}
        </button>
      </div>
    </div>
  );
}
