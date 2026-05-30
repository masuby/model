import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Guard: if env vars are missing at build time, createClient() throws
// "supabaseUrl is required" synchronously at module load, which crashes the
// entire app bundle. Fall back to null and let callers handle it.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase storage not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing). Excel storage features disabled.'
  )
}

// No authentication needed for public bucket
