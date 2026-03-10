import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SLOT_LABELS: Record<string, string> = { midi: 'Midi', soir: 'Soir' }
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

async function supabasePost(path: string, body: unknown) {
  await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Auth: accept service-role (webhook) or admin JWT ---
    const authHeader = req.headers.get('Authorization')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (authHeader === `Bearer ${serviceKey}`) {
      // Trusted internal call from webhook — OK
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const userRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceKey }
      })
      if (!userRes.ok) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const user = await userRes.json()
      const profileRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles?user_id=eq.${user.id}&select=role`, {
        headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
      })
      const profiles = await profileRes.json()
      if (!profiles?.[0] || profiles[0].role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    // --- End auth ---

    // Check notification_settings
    const settingRes = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/notification_settings?key=eq.order_confirmation&select=*`,
      { headers: { 'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}` } }
    )
    const [setting] = await settingRes.json()
    if (!setting?.enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: 'disabled' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')

    const { orderId } = await req.json()
    if (!orderId) throw new Error('orderId is required')

    // Fetch order with event join
    const orders = await supabaseGet(
      `orders?id=eq.${orderId}&select=*,event:events(name,start_date,end_date)`
    )
    const order = Array.isArray(orders) ? orders[0] : null
    if (!order) throw new Error('Order not found')

    // Fetch order lines with joins
    const lines = await supabaseGet(
      `order_lines?order_id=eq.${orderId}&select=*,meal_slot:meal_slots(slot_date,slot_type),menu_item:menu_items(name,type)&order=created_at.asc`
    )

    // Group lines by slot + guest, separate formule vs supplements
    const groups: Record<string, { date: string; type: string; guest: string; items: string[]; supplements: string[] }> = {}
    for (const line of lines || []) {
      const key = `${line.meal_slot?.slot_date}_${line.meal_slot?.slot_type}_${line.guest_name || ''}`
      if (!groups[key]) {
        groups[key] = {
          date: line.meal_slot?.slot_date || '',
          type: line.meal_slot?.slot_type || '',
          guest: line.guest_name || '',
          items: [],
          supplements: [],
        }
      }
      const label = `${line.menu_item?.name || '?'} (${TYPE_LABELS[line.menu_item?.type] || ''})`
      if (line.is_supplement) {
        const qty = (line.quantity || 1) > 1 ? ` ×${line.quantity}` : ''
        const price = line.unit_price ? ` — ${Number(line.unit_price).toFixed(2)}€` : ''
        groups[key].supplements.push(`＋ ${line.menu_item?.name || '?'}${qty}${price}`)
      } else {
        groups[key].items.push(label)
      }
    }

    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.type === 'midi' ? -1 : 1
    })

    // Check if any group has supplements
    const hasSupplements = sortedGroups.some((g) => g.supplements.length > 0)

    // Build HTML email
    const menuRows = sortedGroups.map((g) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${g.date}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${SLOT_LABELS[g.type] || g.type}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#968A42;font-weight:500">${g.guest || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#111827">${g.items.join(', ')}</td>
      </tr>
    `).join('')

    // Supplements section
    const suppRows = sortedGroups.filter((g) => g.supplements.length > 0).map((g) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151">${g.date} ${SLOT_LABELS[g.type] || g.type}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#968A42">${g.supplements.join('<br/>')}</td>
      </tr>
    `).join('')

    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">
      <div style="background:#8B3A43;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Maison Félicien</h1>
        <p style="color:#E5B7B3;margin:4px 0 0;font-size:13px">Confirmation de commande</p>
      </div>
      <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px;margin:0 0 16px">Bonjour <strong>${order.customer_first_name}</strong>,</p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 20px">
          ${(setting.body_intro || 'Votre commande {order_number} pour {event_name} a bien été enregistrée.')
            .replace('{order_number}', order.order_number)
            .replace('{event_name}', order.event?.name || '')}
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Date</th>
              <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Créneau</th>
              <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Convive</th>
              <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Menu</th>
            </tr>
          </thead>
          <tbody>${menuRows}</tbody>
        </table>

        ${hasSupplements ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="background:#f0f0e6">
              <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:bold;color:#968A42;text-transform:uppercase;border-bottom:1px solid #e5e7eb" colspan="2">Suppléments</th>
            </tr>
          </thead>
          <tbody>${suppRows}</tbody>
        </table>` : ''}

        <div style="background:#f8fafc;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#6b7280">Montant total</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#111827">${Number(order.total_amount).toFixed(2)}€</p>
        </div>

        <div style="text-align:center;margin-bottom:20px">
          <p style="font-size:13px;color:#6b7280;margin:0 0 8px">Présentez ce numéro lors du retrait :</p>
          <p style="font-size:20px;font-weight:bold;color:#8B3A43;font-family:monospace;margin:0">${order.order_number}</p>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0">
          Stand ${order.stand} — ${order.customer_email} — ${order.customer_phone}<br />
          Maison Félicien — Traiteur événementiel<br />
          101 rue de Sèvres, 75006 Paris · SIRET 808 374 086
        </p>
      </div>
    </div>`

    // Send via Resend
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Maison Félicien <noreply@maisonfelicien.fr>'
    const recipient = setting.recipient_override || order.customer_email
    const subject = (setting.subject_template || 'Commande confirmée — Maison Félicien')
      .replace('{order_number}', order.order_number)
      .replace('{event_name}', order.event?.name || 'Maison Félicien')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipient],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      // Log email failure
      await supabasePost('email_logs', {
        notification_key: 'order_confirmation',
        recipient,
        subject,
        status: 'error',
        error_message: `Resend ${res.status}: ${errBody}`,
        order_id: orderId,
      }).catch(() => {}) // best-effort logging
      throw new Error(`Resend error: ${res.status} ${errBody}`)
    }

    // Log email success
    await supabasePost('email_logs', {
      notification_key: 'order_confirmation',
      recipient,
      subject,
      status: 'sent',
      order_id: orderId,
    }).catch(() => {}) // best-effort logging

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Email error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
