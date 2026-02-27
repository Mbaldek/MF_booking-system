import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SLOT_LABELS: Record<string, string> = { midi: 'Midi', soir: 'Soir' }
const TYPE_LABELS: Record<string, string> = { entree: 'Entrée', plat: 'Plat', dessert: 'Dessert', boisson: 'Boisson' }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { orderId } = await req.json()
    if (!orderId) throw new Error('orderId is required')

    // Fetch order + event
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, event:events(name, start_date, end_date)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) throw new Error('Order not found')

    // Fetch order lines
    const { data: lines } = await supabase
      .from('order_lines')
      .select('*, meal_slot:meal_slots(slot_date, slot_type), menu_item:menu_items(name, type)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    // Group lines by slot + guest
    const groups: Record<string, { date: string; type: string; guest: string; items: string[] }> = {}
    for (const line of lines || []) {
      const key = `${line.meal_slot?.slot_date}_${line.meal_slot?.slot_type}_${line.guest_name || ''}`
      if (!groups[key]) {
        groups[key] = {
          date: line.meal_slot?.slot_date || '',
          type: line.meal_slot?.slot_type || '',
          guest: line.guest_name || '',
          items: [],
        }
      }
      groups[key].items.push(`${line.menu_item?.name || '?'} (${TYPE_LABELS[line.menu_item?.type] || ''})`)
    }

    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.type === 'midi' ? -1 : 1
    })

    // Build HTML email
    const menuRows = sortedGroups.map((g) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${g.date}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${SLOT_LABELS[g.type] || g.type}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#7c3aed;font-weight:500">${g.guest || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#111827">${g.items.join(', ')}</td>
      </tr>
    `).join('')

    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">
      <div style="background:#2563eb;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Maison Félicien</h1>
        <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Confirmation de commande</p>
      </div>
      <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px;margin:0 0 16px">Bonjour <strong>${order.customer_first_name}</strong>,</p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 20px">
          Votre commande <strong style="color:#111827">${order.order_number}</strong> pour
          <strong style="color:#111827">${order.event?.name || ''}</strong> a bien été enregistrée.
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

        <div style="background:#f8fafc;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#6b7280">Montant total</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#111827">${Number(order.total_amount).toFixed(2)}€</p>
        </div>

        <div style="text-align:center;margin-bottom:20px">
          <p style="font-size:13px;color:#6b7280;margin:0 0 8px">Présentez ce numéro lors du retrait :</p>
          <p style="font-size:20px;font-weight:bold;color:#2563eb;font-family:monospace;margin:0">${order.order_number}</p>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0">
          Stand ${order.stand} — ${order.customer_email} — ${order.customer_phone}<br />
          Maison Félicien — Traiteur événementiel
        </p>
      </div>
    </div>`

    // Send via Resend
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Maison Félicien <noreply@maisonfelicien.fr>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [order.customer_email],
        subject: `Commande ${order.order_number} confirmée — ${order.event?.name || 'Maison Félicien'}`,
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
    console.error('Email error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
