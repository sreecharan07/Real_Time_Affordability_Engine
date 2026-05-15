import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, History as HistoryIcon, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

interface Check {
  id: number;
  purchase_amount: number;
  category: string;
  merchant_name: string;
  purchase_date: string;
  decision: 'SAFE' | 'RISKY' | 'NOT_RECOMMENDED';
  score: number;
  projected_balance: number;
  disposable_balance: number;
  reasons: string[];
  recommendation: string;
  created_at: string;
}

const decisionConfig = {
  SAFE: { icon: ShieldCheck, color: 'var(--safe)', bg: 'var(--safe-subtle)', label: 'SAFE' },
  RISKY: { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-subtle)', label: 'RISKY' },
  NOT_RECOMMENDED: { icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-subtle)', label: 'NOT REC.' },
};

export default function History() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const fetchChecks = () => {
    if (!session) return;
    setLoading(true);
    fetch('/api/affordability', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
      .then(r => r.json())
      .then(d => setChecks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) {
      fetchChecks();
    }
  }, [session]);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Check History</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All past affordability checks</p>
        </div>
        <button onClick={fetchChecks} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {checks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <HistoryIcon className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold">No checks yet</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Run your first affordability check to see history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checks.map((check, i) => {
            const cfg = decisionConfig[check.decision] || decisionConfig.SAFE;
            const Icon = cfg.icon;
            const reasons = Array.isArray(check.reasons) ? check.reasons : [];
            return (
              <motion.div key={check.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{check.merchant_name || 'Unknown Merchant'}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{check.category} · {new Date(check.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black">${parseFloat(check.purchase_amount as any).toFixed(2)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Score: {check.score}/100</p>
                  </div>
                </div>
                {reasons.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
                    {reasons.map((r, ri) => (
                      <span key={ri} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>{r}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
