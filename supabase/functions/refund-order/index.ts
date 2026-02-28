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

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (order.payment_status !== 'paid') throw new Error('Order is not paid — cannot refund')
    if (!order.stripe_payment_intent_id) throw new Error('No Stripe payment intent found')

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    })

    // Update order status
    await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({ success: true, refund_id: refund.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
