import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const { orderId } = await req.json()
    if (!orderId) throw new Error('orderId is required')

    // Fetch order
    const orders = await supabaseQuery(`orders?id=eq.${orderId}&select=*`)
    const order = Array.isArray(orders) ? orders[0] : null
    if (!order) throw new Error('Order not found')
    if (order.payment_status !== 'paid') throw new Error('Order is not paid — cannot refund')
    if (!order.stripe_payment_intent_id) throw new Error('No Stripe payment intent found')

    // Create Stripe refund via REST API
    const stripeRes = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_intent: order.stripe_payment_intent_id,
      }).toString(),
    })

    const refund = await stripeRes.json()
    if (!stripeRes.ok) {
      throw new Error(refund.error?.message || `Stripe refund error ${stripeRes.status}`)
    }

    // Update order status
    await supabaseQuery(
      `orders?id=eq.${orderId}`,
      'PATCH',
      { payment_status: 'refunded' }
    )

    return new Response(
      JSON.stringify({ success: true, refund_id: refund.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Refund error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
