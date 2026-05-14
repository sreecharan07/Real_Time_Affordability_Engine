import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase;
try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing. Check your environment variables.');
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.error('Supabase initialization failed:', err);
  // Create a proxy object that throws on access to help debugging but allows module to load
  supabase = new Proxy({}, {
    get: () => { throw new Error('Supabase client accessed before valid initialization. Check env vars.'); }
  });
}

export default supabase;
