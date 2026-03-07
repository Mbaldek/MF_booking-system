import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
  console.log('=== START create-checkout-session ===')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    console.log('STRIPE_SECRET_KEY exists:', !!stripeKey)
    console.log('STRIPE_SECRET_KEY starts with:', stripeKey?.substring(0, 10))
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const body = await req.json()
    console.log('Body received:', JSON.stringify(body))
    const { orderId } = body
    if (!orderId) throw new Error('orderId is required')

    // Fetch order with event join via Supabase REST
    const orders = await supabaseQuery(
      `orders?id=eq.${orderId}&select=*,event:events(name)`
    )
    console.log('Order fetch result:', Array.isArray(orders) ? orders.length : 'not-array')

    const order = Array.isArray(orders) ? orders[0] : null
    if (!order) throw new Error('Order not found')
    console.log('Order found:', `#${order.order_number} status=${order.payment_status} amount=${order.total_amount}`)

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
    console.log('Menu count:', menuCount, 'from', (lines || []).length, 'order lines')

    // Build Stripe Checkout session via REST API
    const origin = req.headers.get('origin') || 'https://reservation.maison-felicien.com'
    const amount = Math.round(Number(order.total_amount) * 100)
    const description = `${order.event?.name || 'Evenement'} — ${menuCount} menu${menuCount > 1 ? 's' : ''} — ${order.customer_first_name} ${order.customer_last_name}`

    console.log('Calling Stripe with amount:', amount, 'email:', order.customer_email, 'origin:', origin)

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
    console.log('Stripe response status:', stripeRes.status)

    if (!stripeRes.ok) {
      console.log('Stripe error:', JSON.stringify(session.error))
      throw new Error(session.error?.message || `Stripe error ${stripeRes.status}`)
    }

    console.log('Stripe session created:', session.id, 'url:', session.url?.substring(0, 60))

    // Save Stripe session ID on order
    await supabaseQuery(
      `orders?id=eq.${orderId}`,
      'PATCH',
      { stripe_checkout_session_id: session.id }
    )

    console.log('=== END create-checkout-session SUCCESS ===')

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('=== END create-checkout-session ERROR ===', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
