import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, AlertCircle, Calendar, Target, Shield, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

import { formatCurrency } from '../lib/currency';

interface Profile {
  monthly_income: number;
  current_balance: number;
  savings_goal: number;
  safety_buffer: number;
  payday_date: number;
  currency: string;
}
interface Bill { id: number; name: string; amount: number; due_day: number; category: string; }
interface Subscription { id: number; name: string; amount: number; billing_cycle: string; }

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black mb-1">{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;

    const headers = {
      'Authorization': `Bearer ${session.access_token}`
    };

    Promise.all([
      fetch('/api/profile', { headers }).then(r => r.json()),
      fetch('/api/bills', { headers }).then(r => r.json()),
      fetch('/api/subscriptions', { headers }).then(r => r.json()),
    ]).then(([p, b, s]) => {
      setProfile(p);
      setBills(Array.isArray(b) ? b : []);
      setSubs(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, [session]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <Wallet className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
      <p className="text-lg font-semibold">No profile found</p>
      <button onClick={() => navigate('/profile')} className="px-6 py-2.5 rounded-xl font-semibold text-white" style={{ background: 'var(--accent)' }}>Set Up Profile</button>
    </div>
  );

  const totalBills = bills.reduce((s, b) => s + parseFloat(b.amount as any), 0);
  const totalSubs = subs.reduce((s, sub) => s + parseFloat(sub.amount as any), 0);
  const totalObligations = totalBills + totalSubs + (profile.savings_goal || 0);
  const freeCashFlow = profile.monthly_income - totalObligations;
  const disposable = profile.current_balance - totalBills - totalSubs - (profile.savings_goal || 0) - (profile.safety_buffer || 0);

  const today = new Date();
  const currentDay = today.getDate();
  const upcomingBills = bills
    .filter(b => b.due_day >= currentDay && b.due_day <= currentDay + 14)
    .sort((a, b) => a.due_day - b.due_day);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your financial overview at a glance</p>
        </div>
        <button
          onClick={() => navigate('/check')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          <Zap className="w-4 h-4" /> Check Purchase
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Monthly Income" value={formatCurrency(profile.monthly_income, profile.currency)} icon={TrendingUp} color="#3b82f6" sub="Projected for this month" />
        <StatCard label="Current Balance" value={formatCurrency(profile.current_balance, profile.currency)} icon={Wallet} color="#10b981" sub="Across all accounts" />
        <StatCard label="Disposable Cash" value={formatCurrency(disposable, profile.currency)} icon={Shield} color="#8b5cf6" sub="After bills and safety buffer" />
        <StatCard label="Savings Goal" value={formatCurrency(profile.savings_goal, profile.currency)} icon={Target} color="#ec4899" sub="Your monthly target" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Obligations breakdown */}
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base mb-4">Monthly Obligations</h2>
          <div className="space-y-3">
            {[
              { label: 'Fixed Bills', amount: totalBills, color: 'var(--accent)', pct: (totalBills / profile.monthly_income) * 100 },
              { label: 'Subscriptions', amount: totalSubs, color: 'var(--warning)', pct: (totalSubs / profile.monthly_income) * 100 },
              { label: 'Savings Goal', amount: profile.savings_goal, color: 'var(--safe)', pct: (profile.savings_goal / profile.monthly_income) * 100 },
              { label: 'Safety Buffer', amount: profile.safety_buffer, color: '#8b5cf6', pct: (profile.safety_buffer / profile.monthly_income) * 100 },
            ].map(({ label, amount, color, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(amount as any), profile.currency)}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--bg-base)' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fixed Obligations</p>
              <p className="text-xl font-black">{formatCurrency(totalBills + totalSubs, profile.currency)}</p>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Free Cash Flow</p>
              <p className="text-xl font-black text-blue-400">{formatCurrency(freeCashFlow, profile.currency)}</p>
            </div>
          </div>
        </div>

        {/* Upcoming bills */}
        <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-bold text-base">Upcoming Bills</h2>
          </div>
          {upcomingBills.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No bills due in next 14 days</p>
          ) : (
            <div className="space-y-2">
              {upcomingBills.map(bill => {
                const daysUntil = bill.due_day - currentDay;
                return (
                  <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
                    <div>
                      <p className="text-sm font-semibold">{bill.name}</p>
                      <p className="text-xs" style={{ color: daysUntil <= 3 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {daysUntil === 0 ? 'Due today' : `${daysUntil}d away`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(bill.amount, profile.currency)}</p>
                      <p className="text-[10px] text-slate-500">Due on the {bill.due_day}th</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" style={{ color: 'var(--safe)' }} />
              <h3 className="font-bold text-sm">Savings Goal</h3>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Monthly target</span>
              <span className="font-bold">${profile.savings_goal}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span style={{ color: 'var(--text-muted)' }}>Payday</span>
              <span className="font-bold">Day {profile.payday_date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions */}
      <div className="mt-6 rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base">Active Subscriptions</h2>
          <span className="text-sm font-bold" style={{ color: 'var(--warning)' }}>${totalSubs.toFixed(2)}/mo</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {subs.map(sub => (
            <div key={sub.id} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-base)' }}>
              <p className="text-sm font-semibold truncate">{sub.name}</p>
              <p className="text-lg font-black mt-1" style={{ color: 'var(--accent)' }}>${parseFloat(sub.amount as any).toFixed(2)}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub.billing_cycle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
