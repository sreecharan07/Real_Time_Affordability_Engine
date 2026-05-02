import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://aqxceneiitrntnyptqhb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_OXqy-PjCZG8i47l9oQMGKw_YBFqXzgM';

if (supabaseUrl === 'https://aqxceneiitrntnyptqhb.supabase.co') {
  console.warn('Supabase URL or Anon Key is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
