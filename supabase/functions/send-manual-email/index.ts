import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const serviceHeaders = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is admin
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) throw new Error('Missing authorization header')

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` },
    })
    if (!userRes.ok) throw new Error('Not authenticated')
    const caller = await userRes.json()

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${caller.id}&select=role`,
      { headers: serviceHeaders }
    )
    const [callerProfile] = await profileRes.json()
    if (callerProfile?.role !== 'admin') {
      throw new Error('Only admins can send manual emails')
    }

    // Parse body
    const { to, subject, body } = await req.json()
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error('to (array of emails) is required')
    }
    if (!subject || !body) {
      throw new Error('subject and body are required')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Maison Félicien <noreply@maisonfelicien.fr>'

    // Build HTML with MF template
    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#111827">
      <div style="background:#8B3A43;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Maison Félicien</h1>
      </div>
      <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <div style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${escapeHtml(body)}</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0">
          Maison Félicien — Traiteur événementiel
        </p>
      </div>
    </div>`

    let sentCount = 0
    const errors: string[] = []

    // Send to each recipient individually (Resend free tier limit)
    for (const recipient of to) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from: emailFrom, to: [recipient], subject, html }),
        })

        const status = res.ok ? 'sent' : 'error'
        let errorMessage: string | null = null
        if (!res.ok) {
          errorMessage = await res.text()
          errors.push(`${recipient}: ${errorMessage}`)
        } else {
          sentCount++
        }

        // Log to email_logs
        await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
          method: 'POST',
          headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            notification_key: 'manual',
            recipient,
            subject,
            status,
            error_message: errorMessage,
          }),
        })
      } catch (err) {
        errors.push(`${recipient}: ${err.message}`)
        // Log error
        await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
          method: 'POST',
          headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            notification_key: 'manual',
            recipient,
            subject,
            status: 'error',
            error_message: err.message,
          }),
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: sentCount, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-manual-email error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
