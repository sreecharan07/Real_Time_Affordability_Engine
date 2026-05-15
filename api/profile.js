import { getSupabase } from './_supabase.js';
import { requireAuth } from './auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase(token);

  try {
    await requireAuth(req, res, async () => {
      const userId = req.user.id;

      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('financial_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return res.status(200).json(data || null);
      }

      if (req.method === 'POST') {
        const { monthly_income, current_balance, savings_goal, safety_buffer, payday_date } = req.body;

        const { data, error } = await supabase
          .from('financial_profiles')
          .upsert({
            user_id: userId,
            monthly_income,
            current_balance,
            savings_goal,
            safety_buffer,
            payday_date
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      }
    });
  } catch (err) {
    console.error('Profile API error:', err);
    res.status(500).json({ error: err.message });
  }
}
