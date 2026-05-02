import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('financial_profiles')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data || null);
    }

    if (req.method === 'POST') {
      const { monthly_income, current_balance, savings_goal, safety_buffer, payday_date } = req.body;
      // upsert: delete existing and insert new
      await supabase.from('financial_profiles').delete().neq('id', 0);
      const { data, error } = await supabase
        .from('financial_profiles')
        .insert({ monthly_income, current_balance, savings_goal, safety_buffer, payday_date })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Profile API error:', err);
    res.status(500).json({ error: err.message });
  }
}
