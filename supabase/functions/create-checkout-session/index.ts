import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ALLOWED_ORIGINS = [
  'https://reservation.maison-felicien.com',
  'http://localhost:5173',
  'http://localhost:4173',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Fallback for non-request contexts
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Supabase REST helper
async function supabaseQuery(path: string, method = 'GET', body?: unknown) {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`
  const headers: Record<string, string> = {
    'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'PATCH' ? 'return=minimal' : 'return=representation',
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (method === 'PATCH') return null
  return res.json()
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const body = await req.json()
    const { orderId } = body
    if (!orderId) throw new Error('orderId is required')

    // Fetch order with event join via Supabase REST
    const orders = await supabaseQuery(
      `orders?id=eq.${orderId}&select=*,event:events(name)`
    )

    const order = Array.isArray(orders) ? orders[0] : null
    if (!order) throw new Error('Order not found')

    if (order.payment_status === 'paid') throw new Error('Order already paid')

    // Fetch order lines to count menus
    const lines = await supabaseQuery(
      `order_lines?order_id=eq.${orderId}&select=meal_slot_id,guest_name`
    )
    const menuKeys = new Set<string>()
    for (const line of lines || []) {
      menuKeys.add(`${line.meal_slot_id}-${line.guest_name || ''}`)
    }
    const menuCount = menuKeys.size

    // --- Server-side total recalculation (never trust client amount) ---
    const allLines = await supabaseQuery(
      `order_lines?order_id=eq.${orderId}&select=meal_slot_id,guest_name,menu_unit_price,is_supplement,unit_price,quantity`
    )

    let recalcTotal = 0
    const seenMenuKeys = new Set<string>()
    for (const line of allLines || []) {
      if (line.is_supplement) {
        recalcTotal += Number(line.unit_price || 0) * Number(line.quantity || 1)
      } else {
        const key = `${line.meal_slot_id}-${line.guest_name || ''}`
        if (!seenMenuKeys.has(key)) {
          seenMenuKeys.add(key)
          recalcTotal += Number(line.menu_unit_price || 0)
        }
      }
    }

    const amount = Math.round(recalcTotal * 100)
    if (amount <= 0) throw new Error('Montant calculé = 0€ — commande invalide')

    // Correct order total if client sent wrong value
    if (Math.abs(recalcTotal - Number(order.total_amount)) > 0.01) {
      await supabaseQuery(`orders?id=eq.${orderId}`, 'PATCH', { total_amount: recalcTotal })
    }

    // Build Stripe Checkout session via REST API
    const origin = req.headers.get('origin') || 'https://reservation.maison-felicien.com'
    const description = `${order.event?.name || 'Evenement'} — ${menuCount} menu${menuCount > 1 ? 's' : ''} — ${order.customer_first_name} ${order.customer_last_name}`

    const params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('payment_method_types[0]', 'card')
    params.append('customer_email', order.customer_email)
    params.append('metadata[order_id]', orderId)
    params.append('metadata[order_number]', order.order_number)
    params.append('line_items[0][price_data][currency]', 'eur')
    params.append('line_items[0][price_data][unit_amount]', String(amount))
    params.append('line_items[0][price_data][product_data][name]', `Commande ${order.order_number}`)
    params.append('line_items[0][price_data][product_data][description]', description)
    params.append('line_items[0][quantity]', '1')
    params.append('success_url', `${origin}/order/success/${orderId}?payment=success`)
    params.append('cancel_url', `${origin}/order/success/${orderId}?payment=cancelled`)

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await stripeRes.json()

    if (!stripeRes.ok) {
      console.error('Stripe error:', session.error?.message || stripeRes.status)
      throw new Error(session.error?.message || `Stripe error ${stripeRes.status}`)
    }

    // Save Stripe session ID on order
    await supabaseQuery(
      `orders?id=eq.${orderId}`,
      'PATCH',
      { stripe_checkout_session_id: session.id }
    )

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('create-checkout-session error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
