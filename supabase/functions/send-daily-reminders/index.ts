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
    // Compute tomorrow's date (UTC)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

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

    console.log(`Found ${slots.length} slot(s) tomorrow:`, slots.map((s: Record<string, string>) => `${s.slot_type} (${s.id})`))

    // Find all order_lines for these slots, with order + guest info
    const slotIds = slots.map((s: Record<string, string>) => s.id)
    const lines = await supabaseGet(
      `order_lines?meal_slot_id=in.(${slotIds.join(',')})&select=meal_slot_id,guest_name,order_id,order:orders(id,order_number,customer_email,customer_first_name,customer_last_name,stand,payment_status)`
    )

    if (!Array.isArray(lines) || lines.length === 0) {
      console.log('No order lines for tomorrow slots.')
      return new Response(
        JSON.stringify({ message: 'No orders for tomorrow', date: tomorrowStr, slots: slots.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group by order (unique orders that have meals tomorrow)
    const orderMap = new Map<string, { order: Record<string, unknown>; guests: Set<string>; slotTypes: Set<string> }>()
    for (const line of lines) {
      const order = line.order
      if (!order || order.payment_status !== 'paid') continue

      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, { order, guests: new Set(), slotTypes: new Set() })
      }
      const entry = orderMap.get(order.id)!
      if (line.guest_name) entry.guests.add(line.guest_name)

      const slot = slots.find((s: Record<string, string>) => s.id === line.meal_slot_id)
      if (slot) entry.slotTypes.add(slot.slot_type)
    }

    console.log(`Found ${orderMap.size} paid order(s) with meals tomorrow`)

    // Log summary for each order (email sending will be added later)
    for (const [orderId, { order, guests, slotTypes }] of orderMap) {
      console.log(`  - ${order.order_number}: ${guests.size} guest(s), slots: ${[...slotTypes].join('+')}, email: ${order.customer_email}`)
    }

    // TODO: Send reminder emails (E3: reminder J-1)
    // TODO: Send kitchen prep summary to admin (E4)
    // TODO: Send delivery roster to staff (E5)

    return new Response(
      JSON.stringify({
        date: tomorrowStr,
        slotsFound: slots.length,
        ordersToRemind: orderMap.size,
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
