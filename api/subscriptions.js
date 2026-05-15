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
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('id', { ascending: true });
        if (error) throw error;
        return res.status(200).json(data);
      }

      if (req.method === 'POST') {
        const { name, amount, billing_cycle, category } = req.body;
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({ user_id: userId, name, amount, billing_cycle, category })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      res.status(405).json({ error: 'Method not allowed' });
    });
  } catch (err) {
    console.error('Subscriptions API error:', err);
    res.status(500).json({ error: err.message });
  }
}
