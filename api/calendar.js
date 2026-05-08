// api/calendar.js
import supabase from './_supabase.js';
import { requireAuth } from './auth.js';

/**
 * GET /api/calendar
 * Returns an array of projected daily balances for the next 30 days for the
 * authenticated user.
 *
 * Response format:
 * [
 *   { day: 0, actualDate: '2026-05-08', income: 0, expenses: 0,
 *     balance: 1850, events: '', aboveBuffer: true },
 *   ...
 * ]
 */
export default async function handler(req, res) {
  // CORS headers (same as other APIs)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await requireAuth(req, res, async () => {
      const userId = req.user.id;

      // Fetch profile, bills, subscriptions for the user
      const [profileRes, billsRes, subsRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', userId).order('id', { ascending: false }).limit(1).single(),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('subscriptions').select('*').eq('user_id', userId),
      ]);

      const profile = profileRes.data;
      const bills = billsRes.data || [];
      const subscriptions = subsRes.data || [];

      if (!profile) {
        return res.status(200).json({ empty: true });
      }

      const totalSubscriptions = subscriptions.reduce((s, sub) => s + parseFloat(sub.amount), 0);
      const today = new Date();
      const paydayDate = parseInt(profile.payday_date || 1);
      let currentSimBalance = parseFloat(profile.current_balance);

      const cashflowProjection = [];

      for (let i = 0; i < 30; i++) {
        const simDate = new Date(today);
        simDate.setDate(today.getDate() + i);
        const dayOfMonth = simDate.getDate();

        let income = 0;
        let expenses = 0;
        const events = [];

        if (dayOfMonth === paydayDate) {
          income += parseFloat(profile.monthly_income);
          events.push('Payday');
        }

        // Bills due on this day
        bills.forEach(b => {
          if (b.due_day === dayOfMonth) {
            expenses += parseFloat(b.amount);
            events.push(`Bill: ${b.name}`);
          }
        });

        // Simplified subscription handling – apply on the 1st of each month
        if (dayOfMonth === 1 && totalSubscriptions > 0) {
          expenses += totalSubscriptions;
          events.push('Subscriptions');
        }

        currentSimBalance += income - expenses;
        cashflowProjection.push({
          day: i,
          actualDate: simDate.toISOString().split('T')[0],
          income,
          expenses,
          balance: parseFloat(currentSimBalance.toFixed(2)),
          events: events.join(', '),
          aboveBuffer: currentSimBalance >= parseFloat(profile.safety_buffer || 0),
        });
      }

      return res.status(200).json(cashflowProjection);
    });
  } catch (err) {
    console.error('Calendar API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
