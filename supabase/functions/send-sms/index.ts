import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// SMS Edge Function — Skeleton for future implementation
// Supported providers: Twilio, Vonage, OVH SMS
// Set SMS_PROVIDER, SMS_API_KEY, SMS_FROM in Supabase secrets

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const provider = Deno.env.get('SMS_PROVIDER') // 'twilio' | 'vonage' | 'ovh'
    const apiKey = Deno.env.get('SMS_API_KEY')
    const smsFrom = Deno.env.get('SMS_FROM')

    if (!provider || !apiKey) {
      // SMS not configured — silently skip
      return new Response(
        JSON.stringify({ skipped: true, reason: 'SMS not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { orderId } = await req.json()
    if (!orderId) throw new Error('orderId is required')

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number, customer_phone, customer_first_name')
      .eq('id', orderId)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (!order.customer_phone) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'No phone number on order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const message = `Commande ${order.order_number} confirmée. Merci ${order.customer_first_name} ! — Maison Félicien`

    // TODO: Implement provider-specific sending logic
    // Example for Twilio:
    // if (provider === 'twilio') {
    //   const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    //   const authToken = apiKey
    //   const response = await fetch(
    //     `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    //     {
    //       method: 'POST',
    //       headers: {
    //         'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //       },
    //       body: new URLSearchParams({
    //         To: order.customer_phone,
    //         From: smsFrom!,
    //         Body: message,
    //       }),
    //     }
    //   )
    //   const result = await response.json()
    //   return new Response(JSON.stringify({ success: true, sid: result.sid }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   })
    // }

    return new Response(
      JSON.stringify({ skipped: true, reason: `Provider "${provider}" not yet implemented` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
