import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'
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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

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

    // Fetch order lines for line items display
    const { data: lines } = await supabase
      .from('order_lines')
      .select('*, meal_slot:meal_slots(slot_date, slot_type), menu_item:menu_items(name, type)')
      .eq('order_id', orderId)

    // Count menus (unique guest_name + slot combinations)
    const menuKeys = new Set()
    for (const line of lines || []) {
      menuKeys.add(`${line.meal_slot_id}-${line.guest_name || ''}`)
    }
    const menuCount = menuKeys.size

    // Create Stripe Checkout session
    const origin = req.headers.get('origin') || 'https://reservation.maison-felicien.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: order.customer_email,
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(Number(order.total_amount) * 100),
            product_data: {
              name: `Commande ${order.order_number}`,
              description: `${order.event?.name || 'Événement'} — ${menuCount} menu${menuCount > 1 ? 's' : ''} — ${order.customer_first_name} ${order.customer_last_name}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/order/success/${orderId}?payment=success`,
      cancel_url: `${origin}/order/success/${orderId}?payment=cancelled`,
    })

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
