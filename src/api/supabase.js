import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseMissing = !supabaseUrl || !supabaseAnonKey;

if (supabaseMissing) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check Vercel env vars or .env.local');
}

export const supabase = supabaseMissing
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
