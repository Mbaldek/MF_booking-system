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

    // 3. Check if email already exists via profiles table (faster than listing all auth users)
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
      { headers: authHeaders }
    )
    if (existingRes.ok) {
      const existing = await existingRes.json()
      if (Array.isArray(existing) && existing.length > 0) {
        throw new Error('Cet email est déjà utilisé')
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
        throw new Error('Cet email est déjà utilisé')
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
