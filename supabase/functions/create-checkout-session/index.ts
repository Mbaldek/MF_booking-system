import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { orderId } = await req.json()
    if (!orderId) throw new Error('orderId is required')

    // Fetch order with event info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, event:events(name)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (order.payment_status === 'paid') throw new Error('Order already paid')

    // Fetch order lines to count menus
    const { data: lines } = await supabase
      .from('order_lines')
      .select('meal_slot_id, guest_name')
      .eq('order_id', orderId)

    const menuKeys = new Set()
    for (const line of lines || []) {
      menuKeys.add(`${line.meal_slot_id}-${line.guest_name || ''}`)
    }
    const menuCount = menuKeys.size

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
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(Number(order.total_amount) * 100)))
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
      throw new Error(session.error?.message || `Stripe error ${stripeRes.status}`)
    }

    // Save Stripe session ID on order
    await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
