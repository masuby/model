/**
 * SUPABASE CLIENT CONFIGURATION
 *
 * Connects INFORM Tanzania to Supabase PostgreSQL database
 * Provides: Database, Authentication, Real-time sync
 *
 * Setup Instructions:
 * 1. Create account at https://supabase.com
 * 2. Create new project "inform-tanzania"
 * 3. Go to Settings > API
 * 4. Copy Project URL and anon/public key
 * 5. Add to .env file or environment variables
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client (or null if not configured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Log configuration status
if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Using localStorage fallback.');
  console.info('To enable Supabase, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
} else {
  console.log('✅ Supabase connected:', supabaseUrl);
}

/**
 * Check if Supabase connection is working
 */
export async function checkSupabaseConnection() {
  if (!supabase) return { connected: false, reason: 'Not configured' };

  try {
    const { error } = await supabase.from('health_check').select('*').limit(1);
    // Table might not exist, but connection works if no network error
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist - that's OK, connection works
      return { connected: true, reason: 'Connected (tables not initialized)' };
    }
    if (error) {
      return { connected: false, reason: error.message };
    }
    return { connected: true, reason: 'Fully operational' };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };

  return supabase.auth.onAuthStateChange(callback);
}

export default supabase;
