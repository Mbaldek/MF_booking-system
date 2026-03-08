import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TYPE_LABELS: Record<string, string> = { entree: 'Entrée', plat: 'Plat', dessert: 'Dessert', boisson: 'Boisson' }

async function supabaseGet(path: string) {
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`, {
    headers: {
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
    },
  })
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Maison Félicien <noreply@maisonfelicien.fr>'

    const { orderId } = await req.json()
    if (!orderId) throw new Error('orderId is required')

    // Fetch order
    const orders = await supabaseGet(
      `orders?id=eq.${orderId}&select=*,event:events(name)`
    )
    const order = Array.isArray(orders) ? orders[0] : null
    if (!order) throw new Error('Order not found')

    // Fetch order lines with menu items
    const lines = await supabaseGet(
      `order_lines?order_id=eq.${orderId}&select=guest_name,menu_item:menu_items(name,type)&order=created_at.asc`
    )

    // Group items by guest
    const guestItems: Record<string, string[]> = {}
    for (const line of lines || []) {
      const guest = line.guest_name || 'Convive'
      if (!guestItems[guest]) guestItems[guest] = []
      const itemName = line.menu_item?.name
      const itemType = line.menu_item?.type
      if (itemName) {
        guestItems[guest].push(`${itemName} (${TYPE_LABELS[itemType] || itemType})`)
      }
    }

    const menuDetails = Object.entries(guestItems).map(([guest, items]) =>
      `<p style="margin:4px 0;font-size:13px;color:#374151"><strong style="color:#968A42">${guest}</strong> : ${items.join(', ')}</p>`
    ).join('')

    const feedbackBase = `https://reservation.maison-felicien.com/feedback?order=${orderId}`

    const ratingButtons = [
      { emoji: '😍', label: 'Excellent', rating: 4, bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
      { emoji: '😊', label: 'Bien', rating: 3, bg: '#f0f9ff', border: '#bae6fd', color: '#0284c7' },
      { emoji: '😐', label: 'Moyen', rating: 2, bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
      { emoji: '😞', label: 'Décevant', rating: 1, bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
    ].map(r => `
      <a href="${feedbackBase}&rating=${r.rating}" style="display:inline-block;padding:10px 16px;background:${r.bg};border:1px solid ${r.border};border-radius:12px;text-decoration:none;text-align:center;margin:0 4px">
        <span style="font-size:24px;display:block">${r.emoji}</span>
        <span style="font-size:11px;color:${r.color};font-weight:bold">${r.label}</span>
      </a>
    `).join('')

    const html = `
    <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">
      <div style="background:#8B3A43;padding:20px 24px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:18px">Maison Félicien</h1>
        <p style="color:#E5B7B3;margin:4px 0 0;font-size:13px">Votre repas a été livré</p>
      </div>
      <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px;margin:0 0 16px">Bonjour <strong>${order.customer_first_name}</strong>,</p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 20px">
          Votre repas vient d'être livré au stand <strong style="color:#111827">${order.stand}</strong>. Bon appétit !
        </p>

        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase">Votre commande</p>
          ${menuDetails}
        </div>

        <div style="text-align:center;margin-bottom:20px">
          <p style="font-size:14px;color:#374151;margin:0 0 12px;font-weight:bold">Comment était-ce ?</p>
          <div style="display:inline-block">
            ${ratingButtons}
          </div>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
        <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0">
          Commande ${order.order_number} · Stand ${order.stand}<br />
          Maison Félicien — Traiteur événementiel
        </p>
      </div>
    </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [order.customer_email],
        subject: 'Bon appétit ! Votre repas a été livré',
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Resend error: ${res.status} ${errBody}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Delivery confirmation error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
