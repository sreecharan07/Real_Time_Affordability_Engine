import supabase from './_supabase.js';
import { requireAuth } from './auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await requireAuth(req, res, async () => {
      const userId = req.user.id;

      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', userId)
          .order('due_day', { ascending: true });
        if (error) throw error;
        return res.status(200).json(data);
      }

      if (req.method === 'POST') {
        const { name, amount, due_day, category, is_recurring } = req.body;
        const { data, error } = await supabase
          .from('bills')
          .insert({ user_id: userId, name, amount, due_day, category, is_recurring })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        const { error } = await supabase
          .from('bills')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      res.status(405).json({ error: 'Method not allowed' });
    });
  } catch (err) {
    console.error('Bills API error:', err);
    res.status(500).json({ error: err.message });
  }
}
}
