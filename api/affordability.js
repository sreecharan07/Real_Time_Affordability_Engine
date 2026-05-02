import supabase from './_supabase.js';
function computeAffordability({ profile, bills, subscriptions, purchaseAmount }) {
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Bills due before next payday
  const paydayDay = profile.payday_date || 1;
  let daysUntilPayday;
  if (paydayDay > currentDay) {
    daysUntilPayday = paydayDay - currentDay;
  } else {
    daysUntilPayday = daysInMonth - currentDay + paydayDay;
  }

  const upcomingBills = bills.filter(b => {
    const dueDay = b.due_day;
    if (paydayDay > currentDay) {
      return dueDay > currentDay && dueDay <= paydayDay;
    } else {
      return dueDay > currentDay || dueDay <= paydayDay;
    }
  });

  const totalUpcomingBills = upcomingBills.reduce((s, b) => s + parseFloat(b.amount), 0);
  const totalSubscriptions = subscriptions.reduce((s, sub) => s + parseFloat(sub.amount), 0);
  const savingsGoal = parseFloat(profile.savings_goal) || 0;
  const safetyBuffer = parseFloat(profile.safety_buffer) || 300;
  const currentBalance = parseFloat(profile.current_balance);

  const disposableBalance = currentBalance - totalUpcomingBills - totalSubscriptions - savingsGoal - safetyBuffer;
  const projectedBalance = currentBalance - purchaseAmount - totalUpcomingBills - totalSubscriptions - savingsGoal;
  const balanceAfterPurchase = currentBalance - purchaseAmount;

  const reasons = [];
  let score = 100;

  // Rent due soon?
  const rentBill = bills.find(b => b.category === 'rent' || b.name.toLowerCase().includes('rent'));
  if (rentBill) {
    const daysToRent = rentBill.due_day > currentDay ? rentBill.due_day - currentDay : daysInMonth - currentDay + rentBill.due_day;
    if (daysToRent <= 7) {
      reasons.push('Rent due soon');
      score -= 20;
    }
  }

  if (totalSubscriptions > 100) {
    reasons.push('Subscription load is high');
    score -= 10;
  }

  if (purchaseAmount > disposableBalance) {
    reasons.push('Purchase exceeds free cash flow');
    score -= 25;
  }

  if (balanceAfterPurchase < safetyBuffer) {
    reasons.push('Safety buffer will be broken');
    score -= 30;
  }

  if (projectedBalance < 0) {
    reasons.push('Purchase may cause missed bill risk');
    score -= 25;
  }

  if (reasons.length === 0) {
    reasons.push('You are still safe after this purchase');
  }

  score = Math.max(0, Math.min(100, score));

  let decision;
  if (score >= 70) decision = 'SAFE';
  else if (score >= 40) decision = 'RISKY';
  else decision = 'NOT_RECOMMENDED';

  const safeSpendLimit = Math.max(0, disposableBalance);

  // Next safe date: days until payday
  const nextSafeDate = new Date(today);
  nextSafeDate.setDate(today.getDate() + daysUntilPayday);

  let recommendation;
  if (decision === 'SAFE') {
    recommendation = `This purchase looks safe. Your projected balance stays above your safety buffer with $${projectedBalance.toFixed(2)} remaining after all obligations.`;
  } else if (decision === 'RISKY') {
    recommendation = `Proceed with caution. Consider waiting ${daysUntilPayday} days until your next payday to be more comfortable.`;
  } else {
    recommendation = `This purchase is not recommended right now. Wait until after your next payday on the ${paydayDay}${paydayDay === 1 ? 'st' : paydayDay === 2 ? 'nd' : paydayDay === 3 ? 'rd' : 'th'} when you'll have more disposable income.`;
  }

  return {
    decision,
    score,
    projectedBalance: parseFloat(projectedBalance.toFixed(2)),
    disposableBalance: parseFloat(disposableBalance.toFixed(2)),
    balanceAfterPurchase: parseFloat(balanceAfterPurchase.toFixed(2)),
    reasons,
    recommendation,
    safeSpendLimit: parseFloat(safeSpendLimit.toFixed(2)),
    nextSafeDate: nextSafeDate.toISOString().split('T')[0],
    upcomingBillsTotal: parseFloat(totalUpcomingBills.toFixed(2)),
    upcomingBills,
    daysUntilPayday
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { purchase_amount, category, merchant_name, purchase_date } = req.body;

      const [profileRes, billsRes, subsRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').order('id', { ascending: false }).limit(1).single(),
        supabase.from('bills').select('*'),
        supabase.from('subscriptions').select('*')
      ]);

      if (profileRes.error) throw new Error('No financial profile found. Please set up your profile first.');

      const result = computeAffordability({
        profile: profileRes.data,
        bills: billsRes.data || [],
        subscriptions: subsRes.data || [],
        purchaseAmount: parseFloat(purchase_amount)
      });

      // Save the check
      await supabase.from('affordability_checks').insert({
        purchase_amount: parseFloat(purchase_amount),
        category,
        merchant_name,
        purchase_date,
        decision: result.decision,
        score: result.score,
        projected_balance: result.projectedBalance,
        disposable_balance: result.disposableBalance,
        reasons: JSON.stringify(result.reasons),
        recommendation: result.recommendation
      });

      return res.status(200).json(result);
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('affordability_checks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Affordability API error:', err);
    res.status(500).json({ error: err.message });
  }
}
