// api/accounts.js
import supabase from './_supabase.js';
import { requireAuth } from './auth.js';

export default async function handler(req, res) {
  // CORS headers (reuse pattern)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Protect all routes
  await new Promise((resolve) => requireAuth(req, res, resolve));
  if (res.writableEnded) return; // auth failed

  const userId = req.user.id;

  try {
    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase.from('accounts').select('*').eq('user_id', userId);
        if (error) throw error;
        return res.status(200).json({ accounts: data });
      }
      case 'POST': {
        const { name, type, balance } = req.body;
        const { data, error } = await supabase.from('accounts').insert({
          user_id: userId,
          name,
          type,
          balance: balance ?? 0
        }).single();
        if (error) throw error;
        return res.status(201).json({ account: data });
      }
      case 'PUT': {
        const { id, name, type, balance } = req.body;
        const { data, error } = await supabase.from('accounts')
          .update({ name, type, balance })
          .eq('id', id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;
        return res.status(200).json({ account: data });
      }
      case 'DELETE': {
        const { id } = req.body;
        const { error } = await supabase.from('accounts')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return res.status(204).end();
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    console.error('Accounts API error:', e);
    return res.status(500).json({ error: e.message });
  }
}
