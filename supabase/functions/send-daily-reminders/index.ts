import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SLOT_LABELS: Record<string, string> = { midi: 'Midi', soir: 'Soir' }
const SLOT_ICONS: Record<string, string> = { midi: '☀', soir: '☽' }
const TYPE_LABELS: Record<string, string> = { entree: 'Entrée', plat: 'Plat', dessert: 'Dessert', boisson: 'Boisson' }
const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
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

async function sendEmail(resendApiKey: string, emailFrom: string, to: string[], subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: emailFrom, to, subject, html }),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error(`Resend error for ${to.join(',')}: ${res.status} ${errBody}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`Email send failed for ${to.join(',')}:`, err.message)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check notification_settings for both email types
    const settingsRes = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/notification_settings?key=in.(daily_admin_recap,daily_client_reminder)&select=*`,
      { headers: { 'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}` } }
    )
    const settings = await settingsRes.json()
    const adminSetting = settings.find((s: Record<string, unknown>) => s.key === 'daily_admin_recap')
    const clientSetting = settings.find((s: Record<string, unknown>) => s.key === 'daily_client_reminder')

    if (!adminSetting?.enabled && !clientSetting?.enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: 'both disabled' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Maison Félicien <noreply@maisonfelicien.fr>'
    const emailAdmin = adminSetting?.recipient_override || Deno.env.get('EMAIL_ADMIN') || emailFrom.replace(/.*<(.+)>/, '$1')

    // Compute tomorrow's date (UTC)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const tomorrowLabel = formatDateFR(tomorrowStr)

    console.log(`=== send-daily-reminders === Looking for slots on ${tomorrowStr}`)

    // Find meal_slots for tomorrow
    const slots = await supabaseGet(
      `meal_slots?slot_date=eq.${tomorrowStr}&is_active=eq.true&select=id,slot_date,slot_type,event_id`
    )

    if (!Array.isArray(slots) || slots.length === 0) {
      console.log('No active slots tomorrow. Nothing to do.')
      return new Response(
        JSON.stringify({ message: 'No slots tomorrow', date: tomorrowStr }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${slots.length} slot(s) tomorrow`)

    // Fetch all order_lines for these slots with full details
    const slotIds = slots.map((s: Record<string, string>) => s.id)
    const lines = await supabaseGet(
      `order_lines?meal_slot_id=in.(${slotIds.join(',')})&select=meal_slot_id,guest_name,menu_unit_price,order_id,menu_item:menu_items(name,type),order:orders(id,order_number,customer_email,customer_first_name,customer_last_name,stand,payment_status,total_amount)`
    )

    if (!Array.isArray(lines) || lines.length === 0) {
      console.log('No order lines for tomorrow.')
      return new Response(
        JSON.stringify({ message: 'No orders for tomorrow', date: tomorrowStr }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter paid only
    const paidLines = lines.filter((l: Record<string, unknown>) => {
      const order = l.order as Record<string, string> | null
      return order && order.payment_status === 'paid'
    })

    // ═══════════════════════════════════════════
    // E3 — Admin recap email
    // ═══════════════════════════════════════════

    // Group by slot type for admin
    const slotData: Record<string, {
      orders: Map<string, { order: Record<string, unknown>; guests: Set<string>; mealCount: number }>
      itemCounts: Map<string, number>
      totalRevenue: number
    }> = {}

    for (const line of paidLines) {
      const order = line.order as Record<string, unknown>
      const slot = slots.find((s: Record<string, string>) => s.id === line.meal_slot_id)
      if (!slot) continue
      const slotType = slot.slot_type as string

      if (!slotData[slotType]) {
        slotData[slotType] = { orders: new Map(), itemCounts: new Map(), totalRevenue: 0 }
      }
      const sd = slotData[slotType]

      // Track orders
      const oid = order.id as string
      if (!sd.orders.has(oid)) {
        sd.orders.set(oid, { order, guests: new Set(), mealCount: 0 })
      }
      const entry = sd.orders.get(oid)!
      if (line.guest_name) entry.guests.add(line.guest_name)

      // Count menu items
      const itemName = (line.menu_item as Record<string, string>)?.name || '?'
      sd.itemCounts.set(itemName, (sd.itemCounts.get(itemName) || 0) + 1)
    }

    // Compute meal counts and revenue per slot
    for (const slotType of Object.keys(slotData)) {
      const sd = slotData[slotType]
      for (const [, entry] of sd.orders) {
        entry.mealCount = entry.guests.size || 1
        const price = Number((entry.order as Record<string, unknown>).total_amount) || 0
        // Revenue is approximate per slot — we just sum unique menu_unit_prices per guest
      }
    }

    // Build admin email
    let totalOrders = 0
    let totalMeals = 0
    let totalRevenue = 0
    const slotSections: string[] = []

    for (const slotType of ['midi', 'soir']) {
      const sd = slotData[slotType]
      if (!sd) continue

      const orderCount = sd.orders.size
      let slotMeals = 0
      const orderRows: string[] = []
      const standSet = new Set<string>()

      for (const [, { order, guests, mealCount }] of sd.orders) {
        slotMeals += guests.size || 1
        const stand = (order.stand as string) || '—'
        standSet.add(stand)
        orderRows.push(`
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:500;color:#8B3A43">${stand}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${order.customer_first_name} ${order.customer_last_name}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#968A42">${[...guests].join(', ') || '—'}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center">${guests.size || 1}</td>
          </tr>`)
      }

      // Item summary
      const itemSummary = [...sd.itemCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => `${count}× ${name}`)
        .join(' · ')

      const sortedStands = [...standSet].sort()

      totalOrders += orderCount
      totalMeals += slotMeals

      slotSections.push(`
        <div style="margin-bottom:24px">
          <h3 style="margin:0 0 12px;font-size:16px;color:#8B3A43">${SLOT_ICONS[slotType]} ${SLOT_LABELS[slotType]} — ${orderCount} commande${orderCount > 1 ? 's' : ''} · ${slotMeals} repas</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
            <thead>
              <tr style="background:#f8fafc">
                <th style="text-align:left;padding:6px 10px;font-size:10px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Stand</th>
                <th style="text-align:left;padding:6px 10px;font-size:10px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Client</th>
                <th style="text-align:left;padding:6px 10px;font-size:10px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Convives</th>
                <th style="text-align:center;padding:6px 10px;font-size:10px;font-weight:bold;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Repas</th>
              </tr>
            </thead>
            <tbody>${orderRows.join('')}</tbody>
          </table>
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px"><strong>Plats :</strong> ${itemSummary}</p>
          <p style="font-size:12px;color:#6b7280;margin:0"><strong>Stands :</strong> ${sortedStands.join(', ')}</p>
        </div>`)
    }

    // Compute total revenue from unique orders across all slots
    const allOrderIds = new Set<string>()
    for (const sd of Object.values(slotData)) {
      for (const [oid, { order }] of sd.orders) {
        if (!allOrderIds.has(oid)) {
          allOrderIds.add(oid)
          totalRevenue += Number((order as Record<string, unknown>).total_amount) || 0
        }
      }
    }

    const slotsLabel = Object.keys(slotData).map(t => SLOT_LABELS[t]).join(' + ')
    const adminSubject = `Demain — ${tomorrowLabel} · ${slotsLabel} — ${totalOrders} commande${totalOrders > 1 ? 's' : ''}`

    const adminHtml = `
    <div style="max-width:640px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">
      <div style="background:#8B3A43;padding:20px 24px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:18px">Maison Félicien</h1>
        <p style="color:#E5B7B3;margin:4px 0 0;font-size:13px">Commandes à préparer demain</p>
      </div>
      <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:14px;color:#6b7280;margin:0 0 12px">${adminSetting?.body_intro || 'Voici le récapitulatif pour demain.'}</p>
        <p style="font-size:15px;margin:0 0 20px;color:#374151">
          <strong>${tomorrowLabel}</strong> — ${totalOrders} commande${totalOrders > 1 ? 's' : ''} · ${totalMeals} repas · ${totalRevenue.toFixed(2)}€
        </p>

        ${slotSections.join('')}

        <div style="background:#f8fafc;border-radius:8px;padding:16px;text-align:center;margin:20px 0">
          <span style="font-size:14px;color:#374151;font-weight:bold">${totalOrders} commandes · ${totalMeals} repas · ${totalRevenue.toFixed(2)}€</span>
        </div>

        <div style="text-align:center">
          <a href="https://reservation.maison-felicien.com/admin/orders" style="display:inline-block;padding:12px 28px;background:#8B3A43;color:white;text-decoration:none;border-radius:50px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">
            Voir le dashboard
          </a>
        </div>
      </div>
    </div>`

    if (adminSetting?.enabled) {
      const adminSubjectFinal = (adminSetting.subject_template || adminSubject)
        .replace('{slot_count}', String(slots.length))
        .replace('{order_count}', String(totalOrders))
      console.log(`Sending admin recap to ${emailAdmin}`)
      await sendEmail(resendApiKey, emailFrom, [emailAdmin], adminSubjectFinal, adminHtml)
    } else {
      console.log('Admin recap disabled, skipping')
    }

    // ═══════════════════════════════════════════
    // E4 — Client reminder emails (one per client)
    // ═══════════════════════════════════════════

    // Group lines by order for client emails
    const clientOrders = new Map<string, {
      order: Record<string, unknown>
      slotMenus: Map<string, { slotType: string; guests: Map<string, string[]> }>
    }>()

    for (const line of paidLines) {
      const order = line.order as Record<string, unknown>
      const oid = order.id as string
      const slot = slots.find((s: Record<string, string>) => s.id === line.meal_slot_id)
      if (!slot) continue

      if (!clientOrders.has(oid)) {
        clientOrders.set(oid, { order, slotMenus: new Map() })
      }
      const co = clientOrders.get(oid)!
      const slotId = line.meal_slot_id as string

      if (!co.slotMenus.has(slotId)) {
        co.slotMenus.set(slotId, { slotType: slot.slot_type, guests: new Map() })
      }
      const sm = co.slotMenus.get(slotId)!
      const guestName = (line.guest_name as string) || 'Convive'

      if (!sm.guests.has(guestName)) {
        sm.guests.set(guestName, [])
      }
      const itemName = (line.menu_item as Record<string, string>)?.name
      const itemType = (line.menu_item as Record<string, string>)?.type
      if (itemName) {
        sm.guests.get(guestName)!.push(`${itemName} (${TYPE_LABELS[itemType] || itemType})`)
      }
    }

    let clientEmailsSent = 0

    if (!clientSetting?.enabled) {
      console.log('Client reminders disabled, skipping')
    }

    for (const [, { order, slotMenus }] of clientSetting?.enabled ? clientOrders : []) {
      const firstName = (order.customer_first_name as string) || 'Client'
      const email = order.customer_email as string
      const stand = order.stand as string
      const orderNumber = order.order_number as string

      // Build slot sections
      const slotTypes = [...slotMenus.values()].map(s => s.slotType)
      const uniqueSlotTypes = [...new Set(slotTypes)]
      const slotLabel = uniqueSlotTypes.map(t => SLOT_LABELS[t]?.toLowerCase()).join(' et ')

      let menuDetails = ''
      for (const [, { slotType, guests }] of slotMenus) {
        menuDetails += `<p style="margin:12px 0 6px;font-size:13px;font-weight:bold;color:#8B3A43">${SLOT_ICONS[slotType]} ${SLOT_LABELS[slotType]}</p>`
        for (const [guestName, items] of guests) {
          menuDetails += `<p style="margin:2px 0;font-size:13px;color:#374151"><strong style="color:#968A42">${guestName}</strong> : ${items.join(', ')}</p>`
        }
      }

      const clientHtml = `
      <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">
        <div style="background:#8B3A43;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:18px">Maison Félicien</h1>
          <p style="color:#E5B7B3;margin:4px 0 0;font-size:13px">Rappel — votre repas de demain</p>
        </div>
        <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin:0 0 16px">Bonjour <strong>${firstName}</strong>,</p>
          <p style="font-size:14px;color:#6b7280;margin:0 0 20px">
            ${(clientSetting?.body_intro || 'Votre commande sera livrée demain {slot_label} à votre stand {stand}.')
              .replace('{slot_label}', slotLabel)
              .replace('{stand}', stand)}
          </p>

          <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase">Votre menu</p>
            ${menuDetails}
          </div>

          <p style="font-size:14px;color:#6b7280;margin:0 0 20px">
            Notre équipe vous livrera directement sur place. Bon appétit !
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
          <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0">
            Commande ${orderNumber} · Stand ${stand}<br />
            Maison Félicien — Traiteur événementiel
          </p>
        </div>
      </div>`

      const clientRecipient = clientSetting?.recipient_override || email
      const clientSubject = (clientSetting?.subject_template || 'Demain — votre repas vous attend !')
        .replace('{event_name}', (order.event as Record<string, string>)?.name || '')
        .replace('{slot_label}', slotLabel)
        .replace('{date}', tomorrowLabel)
      const sent = await sendEmail(
        resendApiKey,
        emailFrom,
        [clientRecipient],
        clientSubject,
        clientHtml
      )
      if (sent) clientEmailsSent++
    }

    console.log(`=== send-daily-reminders DONE === Admin: 1, Clients: ${clientEmailsSent}/${clientOrders.size}`)

    return new Response(
      JSON.stringify({
        date: tomorrowStr,
        slotsFound: slots.length,
        adminEmailSent: true,
        clientEmailsSent,
        clientEmailsTotal: clientOrders.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Daily reminders error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
