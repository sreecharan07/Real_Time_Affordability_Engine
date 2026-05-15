import { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Shield, Zap, Wallet, TrendingUp, AlertCircle, 
  ArrowRight, Info, CheckCircle2, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

// ─── Constants ───────────────────────────────────────────────────────────────
const RATIOS = {
  PRIMARY: 0.50, // 50% for bills + essential self-spend
  EMERGENCY: 0.30, // 30% for emergency fund
  FLEX: 0.20 // 20% for discretionary / usage
};

const COLORS = {
  primary: '#3b82f6', // blue
  emergency: '#10b981', // green
  flex: '#f59e0b', // amber
  danger: '#ef4444',
  muted: '#64748b'
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface FinancingData {
  monthlyIncome: number;
  totalBills: number;
  totalSubs: number;
  emergencyFundTarget: number;
  flexTarget: number;
  primaryTarget: number;
  currentActualExpenses: number;
}

export default function Financing() {
  const [data, setData] = useState<FinancingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const calculateFinancing = (profile: any, bills: any[], subs: any[]) => {
    const income = profile?.monthly_income || 0;
    const totalBills = bills.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const totalSubs = subs.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    
    return {
      monthlyIncome: income,
      totalBills,
      totalSubs,
      primaryTarget: income * RATIOS.PRIMARY,
      emergencyFundTarget: income * RATIOS.EMERGENCY,
      flexTarget: income * RATIOS.FLEX,
      currentActualExpenses: totalBills + totalSubs
    };
  };

  useEffect(() => {
    if (!session) return;
    const headers = { 'Authorization': `Bearer ${session.access_token}` };

    Promise.all([
      fetch('/api/profile', { headers }).then(r => r.json()),
      fetch('/api/bills', { headers }).then(r => r.json()),
      fetch('/api/subscriptions', { headers }).then(r => r.json()),
    ]).then(([p, b, s]) => {
      setData(calculateFinancing(p, Array.isArray(b) ? b : [], Array.isArray(s) ? s : []));
    }).finally(() => setLoading(false));
  }, [session]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }} />
    </div>
  );

  if (!data || data.monthlyIncome === 0) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center p-6">
      <Wallet className="w-12 h-12 text-slate-500" />
      <h2 className="text-xl font-bold">No Income Data Found</h2>
      <p className="text-sm text-slate-400 max-w-xs">Please set up your monthly income in the Profile section to see your 50/30/20 breakdown.</p>
    </div>
  );

  const pieData = [
    { name: 'Primary (Bills & Essentials)', value: data.primaryTarget, color: COLORS.primary },
    { name: 'Emergency Fund', value: data.emergencyFundTarget, color: COLORS.emergency },
    { name: 'Flex Usage', value: data.flexTarget, color: COLORS.flex },
  ];

  const barData = [
    { 
      name: 'Primary (50%)', 
      Target: data.primaryTarget, 
      Actual: data.currentActualExpenses,
      status: data.currentActualExpenses > data.primaryTarget ? 'Over' : 'Under'
    }
  ];

  const primaryStatus = data.currentActualExpenses <= data.primaryTarget;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Personal Financing</h1>
          <p className="text-sm mt-1 text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4" /> Based on the 50:30:20 wealth distribution rule
          </p>
        </div>
        <div className="bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700/50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Income</p>
          <p className="text-2xl font-black text-blue-400">${data.monthlyIncome.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Targets Summary */}
        <div className="lg:col-span-1 space-y-4">
          {[
            { label: 'Primary Essentials', ratio: '50%', amount: data.primaryTarget, color: COLORS.primary, icon: Wallet, desc: 'Bills & Essential Self-Spend' },
            { label: 'Emergency Fund', ratio: '30%', amount: data.emergencyFundTarget, color: COLORS.emergency, icon: Shield, desc: 'Your Financial Safety Net' },
            { label: 'Flex / Usage', ratio: '20%', amount: data.flexTarget, color: COLORS.flex, icon: Zap, desc: 'Discretionary / Lifestyle' },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl border bg-slate-900/50 border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg" style={{ background: `${item.color}20` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: `${item.color}20`, color: item.color }}>
                  {item.ratio}
                </span>
              </div>
              <p className="text-2xl font-black">${item.amount.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Visual Distribution */}
        <div className="lg:col-span-2 rounded-3xl p-6 border bg-slate-900/50 border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="text-lg font-bold mb-4 self-start">Income Allocation Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actuals vs Target */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-8 border bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Primary Spend Analysis</h3>
              <p className="text-sm text-slate-400">Comparing your bills vs. the 50% target</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black ${primaryStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {primaryStatus ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {primaryStatus ? 'ON TRACK' : 'OVER TARGET'}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Current Bills</p>
                <p className="text-3xl font-black">${data.currentActualExpenses.toLocaleString()}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-700" />
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Allowed Target</p>
                <p className="text-3xl font-black text-blue-400">${data.primaryTarget.toLocaleString()}</p>
              </div>
            </div>

            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${primaryStatus ? 'bg-blue-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((data.currentActualExpenses / data.primaryTarget) * 100, 100)}%` }}
              />
            </div>

            <p className="text-sm text-slate-400 leading-relaxed italic">
              {primaryStatus 
                ? `Great job! You have $${(data.primaryTarget - data.currentActualExpenses).toLocaleString()} remaining in your primary budget for other essential self-spending.`
                : `Caution: Your fixed bills exceed the 50% recommendation by $${(data.currentActualExpenses - data.primaryTarget).toLocaleString()}. Consider reviewing your subscriptions or fixed costs.`
              }
            </p>
          </div>
        </div>

        {/* Emergency Fund Focus */}
        <div className="rounded-3xl p-8 border bg-emerald-950/20 border-emerald-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-emerald-400 mb-2">30% Security Shield</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-sm">
              We recommend dedicating 30% of your income ($${data.emergencyFundTarget.toLocaleString()}/mo) 
              specifically to an emergency fund until you have 6 months of expenses covered.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly Goal</p>
                <p className="text-xl font-black text-white">${data.emergencyFundTarget.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Yearly Outlook</p>
                <p className="text-xl font-black text-emerald-400">${(data.emergencyFundTarget * 12).toLocaleString()}</p>
              </div>
            </div>
          </div>
          {/* Decorative background icon */}
          <Target className="absolute -right-8 -bottom-8 w-48 h-48 text-emerald-500/5" />
        </div>
      </div>
    </div>
  );
}
