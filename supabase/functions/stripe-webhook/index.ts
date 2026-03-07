import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Stripe webhook signature verification using Web Crypto API
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  tolerance = 300 // 5 minutes
): Promise<Record<string, unknown>> {
  const parts: Record<string, string> = {}
  for (const item of sigHeader.split(',')) {
    const [key, value] = item.split('=')
    parts[key] = value
  }

  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) throw new Error('Invalid signature header')

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - Number(timestamp)) > tolerance) {
    throw new Error('Webhook timestamp too old')
  }

  // Compute expected signature: HMAC-SHA256 of "timestamp.payload"
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (expected !== signature) throw new Error('Invalid signature')

  return JSON.parse(payload)
}

serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured')

    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    if (!sig) throw new Error('Missing stripe-signature header')

    const event = await verifyStripeSignature(body, sig, webhookSecret)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data as { object: Record<string, unknown> }
        const obj = session.object
        const orderId = (obj.metadata as Record<string, string>)?.order_id

        if (orderId) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              stripe_payment_intent_id: obj.payment_intent as string,
              paid_at: new Date().toISOString(),
            })
            .eq('id', orderId)

          // Trigger order confirmation email
          await supabase.functions.invoke('send-order-confirmation', {
            body: { orderId },
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data as { object: Record<string, unknown> }
        const paymentIntent = charge.object.payment_intent as string

        if (paymentIntent) {
          await supabase
            .from('orders')
            .update({ payment_status: 'refunded' })
            .eq('stripe_payment_intent_id', paymentIntent)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
