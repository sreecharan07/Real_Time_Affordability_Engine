import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const [profileRes, billsRes, subsRes, checksRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').order('id', { ascending: false }).limit(1).single(),
        supabase.from('bills').select('*'),
        supabase.from('subscriptions').select('*'),
        supabase.from('affordability_checks').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      const profile = profileRes.data;
      const bills = billsRes.data || [];
      const subscriptions = subsRes.data || [];
      const checks = checksRes.data || [];

      if (!profile) return res.status(200).json({ empty: true });

      const totalFixedExpenses = bills.reduce((s, b) => s + parseFloat(b.amount), 0);
      const totalSubscriptions = subscriptions.reduce((s, sub) => s + parseFloat(sub.amount), 0);
      const totalObligations = totalFixedExpenses + totalSubscriptions + parseFloat(profile.savings_goal || 0);
      const freeCashFlow = parseFloat(profile.monthly_income) - totalObligations;
      const spendingRatio = totalObligations / parseFloat(profile.monthly_income);

      let spendingRiskLevel;
      if (spendingRatio < 0.5) spendingRiskLevel = 'LOW';
      else if (spendingRatio < 0.75) spendingRiskLevel = 'MEDIUM';
      else spendingRiskLevel = 'HIGH';

      // Monthly trend: last 6 months simulated
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const today = new Date();
      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthChecks = checks.filter(c => {
          const cd = new Date(c.created_at);
          return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
        });
        const safeCount = monthChecks.filter(c => c.decision === 'SAFE').length;
        const riskyCount = monthChecks.filter(c => c.decision === 'RISKY').length;
        const notRecCount = monthChecks.filter(c => c.decision === 'NOT_RECOMMENDED').length;
        const totalSpend = monthChecks.reduce((s, c) => s + parseFloat(c.purchase_amount || 0), 0);
        const avg_score = monthChecks.length ? Math.round(monthChecks.reduce((s, c) => s + (c.score || 0), 0) / monthChecks.length) : 0;
        
        trend.push({
          month: monthNames[d.getMonth()],
          safe: safeCount,
          risky: riskyCount,
          not_recommended: notRecCount,
          total_checks: monthChecks.length,
          avg_score,
          total_spend: parseFloat(totalSpend.toFixed(2))
        });
      }

      // Bill categories breakdown
      const billsByCategory = {};
      bills.forEach(b => {
        const cat = b.category || 'other';
        billsByCategory[cat] = (billsByCategory[cat] || 0) + parseFloat(b.amount);
      });

      const decisionBreakdown = {
        safe: checks.filter(c => c.decision === 'SAFE').length,
        risky: checks.filter(c => c.decision === 'RISKY').length,
        not_recommended: checks.filter(c => c.decision === 'NOT_RECOMMENDED').length
      };

      const waterfallData = [
        { name: 'Income', value: parseFloat(profile.monthly_income), type: 'income' },
        { name: 'Fixed Bills', value: -totalFixedExpenses, type: 'expense' },
        { name: 'Subscriptions', value: -totalSubscriptions, type: 'expense' },
        { name: 'Savings Goal', value: -parseFloat(profile.savings_goal || 0), type: 'expense' },
        { name: 'Free Cash Flow', value: freeCashFlow, type: 'result' }
      ];

      const scoreBuckets = [
        { range: '0-20', count: checks.filter(c => c.score <= 20).length },
        { range: '21-40', count: checks.filter(c => c.score > 20 && c.score <= 40).length },
        { range: '41-60', count: checks.filter(c => c.score > 40 && c.score <= 60).length },
        { range: '61-80', count: checks.filter(c => c.score > 60 && c.score <= 80).length },
        { range: '81-100', count: checks.filter(c => c.score > 80).length },
      ];

      const categorySpendMap = {};
      checks.forEach(c => {
        const cat = c.category || 'other';
        if (!categorySpendMap[cat]) categorySpendMap[cat] = { category: cat, total: 0, amount: 0, safe: 0, risky: 0, not_recommended: 0 };
        categorySpendMap[cat].total++;
        categorySpendMap[cat].amount += parseFloat(c.purchase_amount);
        if (c.decision === 'SAFE') categorySpendMap[cat].safe++;
        else if (c.decision === 'RISKY') categorySpendMap[cat].risky++;
        else categorySpendMap[cat].not_recommended++;
      });
      const categorySpend = Object.values(categorySpendMap);

      const checksScatter = checks.map(c => ({
        amount: parseFloat(c.purchase_amount),
        score: c.score,
        decision: c.decision,
        name: c.merchant_name || 'Purchase'
      }));

      // 30 day cashflow projection
      const cashflowProjection = [];
      let currentSimBalance = parseFloat(profile.current_balance);
      const currentDay = today.getDate();
      const paydayDate = parseInt(profile.payday_date || 1);
      
      for (let i = 0; i < 30; i++) {
        const simDate = new Date(today);
        simDate.setDate(today.getDate() + i);
        const dayOfMonth = simDate.getDate();
        
        let income = 0;
        let expenses = 0;
        let events = [];

        if (dayOfMonth === paydayDate) {
          income += parseFloat(profile.monthly_income);
          events.push('Payday');
        }

        bills.forEach(b => {
          if (b.due_day === dayOfMonth) {
            expenses += parseFloat(b.amount);
            events.push(`Bill: ${b.name}`);
          }
        });

        // Simplified subscriptions (assume evenly distributed or random for demo, or ignore days)
        // We'll just distribute subs on the 1st
        if (dayOfMonth === 1) {
          expenses += totalSubscriptions;
          if (totalSubscriptions > 0) events.push('Subscriptions');
        }

        currentSimBalance += income - expenses;
        cashflowProjection.push({
          day: i,
          actualDate: simDate.toISOString().split('T')[0],
          income,
          expenses,
          balance: currentSimBalance,
          events: events.join(', '),
          aboveBuffer: currentSimBalance >= parseFloat(profile.safety_buffer || 0)
        });
      }

      const avgScore = checks.length ? Math.round(checks.reduce((s,c) => s + c.score, 0) / checks.length) : 0;
      const avgPurchaseAmount = checks.length ? checks.reduce((s,c) => s + parseFloat(c.purchase_amount), 0) / checks.length : 0;

      return res.status(200).json({
        totalFixedExpenses: parseFloat(totalFixedExpenses.toFixed(2)),
        totalSubscriptions: parseFloat(totalSubscriptions.toFixed(2)),
        totalObligations: parseFloat(totalObligations.toFixed(2)),
        freeCashFlow: parseFloat(freeCashFlow.toFixed(2)),
        spendingRiskLevel,
        spendingRatio: parseFloat((spendingRatio * 100).toFixed(1)),
        monthlyIncome: parseFloat(profile.monthly_income),
        currentBalance: parseFloat(profile.current_balance),
        savingsGoal: parseFloat(profile.savings_goal || 0),
        safetyBuffer: parseFloat(profile.safety_buffer || 0),
        paydayDate: parseInt(profile.payday_date || 1),
        trend,
        billsByCategory,
        billsData: bills.map(b => ({ ...b, amount: parseFloat(b.amount) })),
        subsData: subscriptions.map(s => ({ ...s, amount: parseFloat(s.amount), annual: parseFloat(s.amount) * (s.billing_cycle === 'weekly' ? 52 : s.billing_cycle === 'annual' ? 1 : 12) })),
        decisionBreakdown,
        scoreBuckets,
        categorySpend,
        cashflowProjection,
        waterfallData,
        checksScatter,
        totalChecks: checks.length,
        avgScore,
        avgPurchaseAmount: parseFloat(avgPurchaseAmount.toFixed(2))
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Insights API error:', err);
    res.status(500).json({ error: err.message });
  }
}
