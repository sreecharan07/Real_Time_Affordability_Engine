import { useState } from 'react';
import { Zap, ShieldCheck, AlertTriangle, XCircle, DollarSign, Calendar, Tag, Store, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';

interface CheckResult {
  decision: 'SAFE' | 'RISKY' | 'NOT_RECOMMENDED';
  score: number;
  projectedBalance: number;
  disposableBalance: number;
  balanceAfterPurchase: number;
  reasons: string[];
  recommendation: string;
  safeSpendLimit: number;
  nextSafeDate: string;
  upcomingBillsTotal: number;
  upcomingBills: any[];
  daysUntilPayday: number;
}

const CATEGORIES = ['Food & Dining', 'Shopping', 'Entertainment', 'Electronics', 'Travel', 'Health', 'Clothing', 'Home & Garden', 'Sports', 'Other'];

const decisionConfig = {
  SAFE: { icon: ShieldCheck, color: 'var(--safe)', bg: 'var(--safe-subtle)', label: 'SAFE TO SPEND', border: '#22c55e40' },
  RISKY: { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-subtle)', label: 'RISKY', border: '#f59e0b40' },
  NOT_RECOMMENDED: { icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-subtle)', label: 'NOT RECOMMENDED', border: '#ef444440' },
};

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? 'var(--safe)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--bg-base)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black">{score}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 100</span>
      </div>
    </div>
  );
}

export default function AffordabilityChecker() {
  const [form, setForm] = useState({ purchase_amount: '', category: 'Shopping', merchant_name: '', purchase_date: new Date().toISOString().split('T')[0] });
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { session } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.purchase_amount || parseFloat(form.purchase_amount) <= 0) {
      setError('Please enter a valid purchase amount.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/affordability', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ ...form, purchase_amount: parseFloat(form.purchase_amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setForm({ purchase_amount: '', category: 'Shopping', merchant_name: '', purchase_date: new Date().toISOString().split('T')[0] }); };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Affordability Checker</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Enter purchase details to get an instant affordability verdict</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="rounded-2xl p-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <h2 className="font-bold mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Purchase Details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Purchase Amount (CAD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number" step="0.01" min="0" placeholder="0.00"
                  value={form.purchase_amount}
                  onChange={e => setForm(f => ({ ...f, purchase_amount: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none appearance-none"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Merchant Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text" placeholder="e.g. Amazon, Best Buy"
                  value={form.merchant_name}
                  onChange={e => setForm(f => ({ ...f, merchant_name: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Purchase Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  value={form.purchase_date}
                  onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Zap className="w-4 h-4" /> Check Affordability</>}
            </button>
          </form>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {(() => {
                const cfg = decisionConfig[result.decision];
                const Icon = cfg.icon;
                return (
                  <div className="rounded-2xl p-6 border" style={{ background: cfg.bg, borderColor: cfg.border }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: cfg.color }}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Decision</p>
                          <p className="text-xl font-black" style={{ color: cfg.color }}>{cfg.label}</p>
                        </div>
                      </div>
                      <button onClick={reset} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}><RotateCcw className="w-4 h-4" /></button>
                    </div>
                    <ScoreRing score={result.score} />
                    <p className="text-center text-xs mt-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Affordability Score</p>
                  </div>
                );
              })()}

              <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm mb-3">Balance Breakdown</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Current Balance', value: `$${parseFloat(form.purchase_amount || '0').toFixed(2)} → $${result.balanceAfterPurchase.toFixed(2)}` },
                    { label: 'Disposable Balance', value: `$${result.disposableBalance.toFixed(2)}` },
                    { label: 'Projected Balance', value: `$${result.projectedBalance.toFixed(2)}`, highlight: result.projectedBalance < 0 },
                    { label: 'Upcoming Bills', value: `$${result.upcomingBillsTotal.toFixed(2)}` },
                    { label: 'Days Until Payday', value: `${result.daysUntilPayday} days` },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="font-semibold" style={{ color: highlight ? 'var(--danger)' : 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm mb-3">Reason Codes</h3>
                <div className="space-y-2">
                  {result.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm mb-2">Recommendation</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{result.recommendation}</p>
                <div className="mt-3 pt-3 border-t flex justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Safe Spend Limit</p>
                    <p className="font-black" style={{ color: 'var(--safe)' }}>${result.safeSpendLimit.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Next Safe Date</p>
                    <p className="font-bold text-sm">{result.nextSafeDate}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full rounded-2xl border p-12" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', minHeight: '400px' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-subtle)' }}>
                <Zap className="w-8 h-8" style={{ color: 'var(--accent)' }} />
              </div>
              <p className="font-bold text-lg mb-2">Ready to check</p>
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>Enter purchase details on the left and hit "Check Affordability" to get your instant verdict.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
