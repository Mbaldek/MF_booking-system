import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const authHeaders = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify the caller is an admin
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) throw new Error('Missing authorization header')

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!userRes.ok) throw new Error('Not authenticated')
    const caller = await userRes.json()

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${caller.id}&select=role`,
      { headers: authHeaders }
    )
    const [callerProfile] = await profileRes.json()
    if (callerProfile?.role !== 'admin') {
      throw new Error('Only admins can create users')
    }

    // 2. Parse body
    const { email, password, display_name, phone, role } = await req.json()
    if (!email || !password || !role) {
      throw new Error('email, password and role are required')
    }
    if (!['admin', 'staff'].includes(role)) {
      throw new Error('role must be admin or staff')
    }

    // 3. Check if email already exists via Auth Admin API (covers users without profiles row)
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`,
      { headers: authHeaders }
    )
    if (listRes.ok) {
      const listBody = await listRes.json()
      const users = listBody?.users || []
      const emailLower = email.toLowerCase()
      const exists = users.some((u: any) => u.email?.toLowerCase() === emailLower)
      if (exists) {
        return new Response(
          JSON.stringify({ error: 'Cet email est déjà utilisé' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 4. Create auth user via Admin API
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name, phone },
      }),
    })

    if (!createRes.ok) {
      const errBody = await createRes.json()
      const msg = errBody?.msg || errBody?.message || errBody?.error || JSON.stringify(errBody)
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
        return new Response(
          JSON.stringify({ error: 'Cet email est déjà utilisé' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(msg)
    }

    const newUser = await createRes.json()
    const userId = newUser.id

    // 5. Update profile with role and extra fields
    const profileUpdateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: { ...authHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ role, display_name, phone }),
      }
    )

    if (!profileUpdateRes.ok) {
      const errText = await profileUpdateRes.text()
      throw new Error(`Profile update failed: ${errText}`)
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('create-user error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
