// api/scenario.js
import supabase from './_supabase.js';
import { requireAuth } from './auth.js';

/**
 * POST /api/scenario
 * Body: { purchaseAmount: number, purchaseDate?: string }
 * Returns the cash‑flow projection with the simulated purchase and a
 * detailed explainability object showing the exact math used.
 */
export default async function handler(req, res) {
  // CORS headers – same as other APIs
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await requireAuth(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { purchaseAmount, purchaseDate } = req.body;
      if (typeof purchaseAmount !== 'number' || purchaseAmount <= 0) {
        return res.status(400).json({ error: 'Invalid purchaseAmount' });
      }

      const userId = req.user.id;

      // Fetch user‑specific data
      const [{ data: profile }, { data: bills }, { data: subscriptions }] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', userId).order('id', { ascending: false }).limit(1).single(),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('subscriptions').select('*').eq('user_id', userId),
      ]);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const totalSubscriptions = subscriptions.reduce((s, sub) => s + parseFloat(sub.amount), 0);
      const today = new Date();
      const simulationDate = purchaseDate ? new Date(purchaseDate) : today;
      const paydayDate = parseInt(profile.payday_date) || 1;

      // Base cash‑flow projection (30 days) – same logic as calendar.js
      let balance = parseFloat(profile.current_balance);
      const projection = [];

      for (let i = 0; i < 30; i++) {
        const simDate = new Date(today);
        simDate.setDate(today.getDate() + i);
        const dayOfMonth = simDate.getDate();
        let income = 0;
        let expenses = 0;
        const events = [];

        // Payday
        if (dayOfMonth === paydayDate) {
          income += parseFloat(profile.monthly_income);
          events.push('Payday');
        }

        // Bills
        bills.forEach((b) => {
          if (b.due_day === dayOfMonth) {
            expenses += parseFloat(b.amount);
            events.push(`Bill: ${b.name}`);
          }
        });

        // Subscriptions on the 1st
        if (dayOfMonth === 1 && totalSubscriptions > 0) {
          expenses += totalSubscriptions;
          events.push('Subscriptions');
        }

        // Apply the simulated purchase on the chosen day
        if (simDate.toDateString() === simulationDate.toDateString()) {
          expenses += purchaseAmount;
          events.push(`Simulated Purchase: $${purchaseAmount}`);
        }

        balance += income - expenses;
        projection.push({
          day: i,
          date: simDate.toISOString().split('T')[0],
          income,
          expenses,
          balance: parseFloat(balance.toFixed(2)),
          events: events.join(', '),
          aboveBuffer: balance >= parseFloat(profile.safety_buffer || 0),
        });
      }

      // Explainability – exact math for the first day (today) decision
      const explainability = {
        currentBalance: parseFloat(profile.current_balance),
        totalBills: bills.reduce((s, b) => s + parseFloat(b.amount), 0),
        totalSubscriptions,
        safetyBuffer: parseFloat(profile.safety_buffer || 0),
        purchaseAmount,
        safeSpendLimit: parseFloat(
          profile.current_balance -
            bills.reduce((s, b) => s + parseFloat(b.amount), 0) -
            totalSubscriptions -
            (profile.safety_buffer || 0)
        ).toFixed(2),
        result: balance >= parseFloat(profile.safety_buffer || 0) ? 'SAFE' : 'RISKY',
        // Additional notes for edge cases
        notes: []
      };

      // Edge‑case notes
      if (balance < 0) explainability.notes.push('Negative balance after purchase');
      // Rent due tomorrow example (if a rent bill exists)
      const rentBill = bills.find((b) => b.category?.toLowerCase() === 'rent');
      if (rentBill && new Date(rentBill.due_day).setDate(rentBill.due_day) === today.getDate() + 1) {
        explainability.notes.push('Rent due tomorrow');
      }

      return res.status(200).json({ projection, explainability });
    });
  } catch (err) {
    console.error('Scenario API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
