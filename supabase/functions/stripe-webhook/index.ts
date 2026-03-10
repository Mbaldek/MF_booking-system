import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Supabase REST helper
async function supabaseQuery(path: string, method = 'GET', body?: unknown) {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`
  const headers: Record<string, string> = {
    'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'PATCH' || method === 'DELETE' ? 'return=minimal' : 'return=representation',
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (method === 'PATCH' || method === 'DELETE') return null
  return res.json()
}

// Stripe webhook signature verification using Web Crypto API
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  tolerance = 300
): Promise<Record<string, unknown>> {
  const parts: Record<string, string> = {}
  for (const item of sigHeader.split(',')) {
    const [key, value] = item.split('=')
    parts[key] = value
  }

  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) throw new Error('Invalid signature header')

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - Number(timestamp)) > tolerance) {
    throw new Error('Webhook timestamp too old')
  }

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

// Invoke another Edge Function
async function invokeEdgeFunction(name: string, body: unknown) {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured')

    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    if (!sig) throw new Error('Missing stripe-signature header')

    const event = await verifyStripeSignature(body, sig, webhookSecret)

    // Idempotence: skip already-processed events
    const eventId = event.id as string
    if (eventId) {
      const existing = await supabaseQuery(`webhook_events?stripe_event_id=eq.${eventId}`)
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`Webhook event ${eventId} already processed — skipping`)
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
      // Record this event before processing
      await supabaseQuery('webhook_events', 'POST', {
        stripe_event_id: eventId,
        event_type: event.type as string,
      })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data as { object: Record<string, unknown> }
        const obj = session.object
        const orderId = (obj.metadata as Record<string, string>)?.order_id

        if (orderId) {
          await supabaseQuery(
            `orders?id=eq.${orderId}`,
            'PATCH',
            {
              payment_status: 'paid',
              stripe_payment_intent_id: obj.payment_intent as string,
              paid_at: new Date().toISOString(),
            }
          )

          // Trigger order confirmation email + admin notification
          await invokeEdgeFunction('send-order-confirmation', { orderId })
          await invokeEdgeFunction('send-admin-notification', { orderId })
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data as { object: Record<string, unknown> }
        const obj = session.object
        const orderId = (obj.metadata as Record<string, string>)?.order_id

        if (orderId) {
          // Load the order to check status
          const orders = await supabaseQuery(`orders?id=eq.${orderId}&select=id,order_number,payment_status,customer_email,customer_first_name`)
          const order = Array.isArray(orders) ? orders[0] : null

          if (order && order.payment_status === 'pending') {
            // Send failure email via Resend (best-effort)
            try {
              const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
              const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Maison Félicien <ne-pas-repondre@maisonfelicien.com>'
              const SITE_URL = Deno.env.get('SITE_URL') || 'https://maisonfelicien.com'

              if (RESEND_API_KEY) {
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: EMAIL_FROM,
                    to: [order.customer_email],
                    subject: "Votre commande n'a pas abouti — Maison Félicien",
                    html: `
                      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
                        <h2 style="color:#8B3A43;font-style:italic">Maison Félicien</h2>
                        <p>Bonjour ${order.customer_first_name || ''},</p>
                        <p>Votre commande <strong>${order.order_number}</strong> n'a pas pu être finalisée car le paiement n'a pas abouti.</p>
                        <p>Si vous souhaitez recommander, rendez-vous sur :<br/>
                        <a href="${SITE_URL}/order" style="color:#8B3A43">${SITE_URL}/order</a></p>
                        <p style="color:#9A8A7C;font-size:13px;margin-top:24px">L'équipe Maison Félicien</p>
                      </div>
                    `,
                  }),
                })
              }
            } catch (emailErr) {
              console.warn('Failed to send expiry email:', emailErr.message)
            }

            // Delete order_lines then order
            await supabaseQuery(`order_lines?order_id=eq.${orderId}`, 'DELETE')
            await supabaseQuery(`orders?id=eq.${orderId}`, 'DELETE')
          }
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data as { object: Record<string, unknown> }
        const paymentIntent = charge.object.payment_intent as string

        if (paymentIntent) {
          await supabaseQuery(
            `orders?stripe_payment_intent_id=eq.${paymentIntent}`,
            'PATCH',
            { payment_status: 'refunded' }
          )
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
