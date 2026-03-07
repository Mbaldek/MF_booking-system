import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const emailAdmin = Deno.env.get('EMAIL_ADMIN') || emailFrom.replace(/.*<(.+)>/, '$1')

    const { orderId } = await req.json()
    if (!orderId) throw new Error('orderId is required')

    // Fetch order with event
    const orders = await supabaseGet(
      `orders?id=eq.${orderId}&select=*,event:events(name)`
    )
    const order = Array.isArray(orders) ? orders[0] : null
    if (!order) throw new Error('Order not found')

    // Count menus (unique guest_name + slot combos)
    const lines = await supabaseGet(
      `order_lines?order_id=eq.${orderId}&select=meal_slot_id,guest_name`
    )
    const menuKeys = new Set<string>()
    for (const line of lines || []) {
      menuKeys.add(`${line.meal_slot_id}-${line.guest_name || ''}`)
    }
    const menuCount = menuKeys.size

    const amount = Number(order.total_amount).toFixed(2)
    const dashboardUrl = 'https://reservation.maison-felicien.com/admin/orders'

    const html = `
    <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">
      <div style="background:#8B3A43;padding:20px 24px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:18px">Nouvelle commande</h1>
      </div>
      <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px">Commande</td>
            <td style="padding:6px 0;font-size:14px;font-weight:bold;color:#8B3A43;font-family:monospace">${order.order_number}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280">Client</td>
            <td style="padding:6px 0;font-size:14px;color:#111827">${order.customer_first_name} ${order.customer_last_name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280">Stand</td>
            <td style="padding:6px 0;font-size:14px;color:#111827">${order.stand}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280">Email</td>
            <td style="padding:6px 0;font-size:14px;color:#111827">${order.customer_email}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280">Téléphone</td>
            <td style="padding:6px 0;font-size:14px;color:#111827">${order.customer_phone || '—'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280">Événement</td>
            <td style="padding:6px 0;font-size:14px;color:#111827">${order.event?.name || '—'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280">Repas</td>
            <td style="padding:6px 0;font-size:14px;color:#111827">${menuCount} menu${menuCount > 1 ? 's' : ''}</td>
          </tr>
        </table>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#16a34a">Montant encaissé</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:bold;color:#111827">${amount}€</p>
        </div>

        <div style="text-align:center">
          <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#8B3A43;color:white;text-decoration:none;border-radius:50px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">
            Voir les commandes
          </a>
        </div>
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
        to: [emailAdmin],
        subject: `Nouvelle commande ${order.order_number} — ${amount}€`,
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
    console.error('Admin notification error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
