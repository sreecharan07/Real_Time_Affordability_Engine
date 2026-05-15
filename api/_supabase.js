import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export function getSupabase(token) {
  if (!token) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  // Create a client with the user's JWT to trigger RLS correctly
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

// Fallback for non-authenticated internal calls
const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
