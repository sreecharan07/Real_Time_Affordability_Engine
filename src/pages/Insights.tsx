import { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  ReferenceLine, LabelList
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, PieChart as PieIcon,
  BarChart3, Activity, Download, RefreshCw, Shield, Target, Zap,
  ShieldCheck, XCircle, Calendar, CreditCard, Repeat
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { formatCurrency } from '../lib/currency';

// ─── Types ───────────────────────────────────────────────────────────────────
interface InsightsData {
  totalFixedExpenses: number; totalSubscriptions: number; totalObligations: number;
  freeCashFlow: number; spendingRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; spendingRatio: number;
  monthlyIncome: number; currentBalance: number; savingsGoal: number; safetyBuffer: number;
  paydayDate: number;
  trend: any[]; billsByCategory: Record<string, number>; billsData: any[]; subsData: any[];
  decisionBreakdown: { safe: number; risky: number; not_recommended: number };
  scoreBuckets: any[]; categorySpend: any[]; cashflowProjection: any[];
  waterfallData: any[]; checksScatter: any[];
  totalChecks: number; avgScore: number; avgPurchaseAmount: number; empty?: boolean;
}

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  accent: '#3b6ef8', safe: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
  muted: '#5a6480', surface: '#161b27', base: '#0f1117', text: '#f0f4ff',
  border: '#1e2535', purple: '#8b5cf6', cyan: '#06b6d4', teal: '#10b981', pink: '#ec4899',
};
const CAT_COLORS: Record<string, string> = {
  rent: C.accent, utilities: C.purple, insurance: C.cyan, phone: C.warning,
  internet: C.teal, groceries: '#3b82f6', transport: C.pink, credit_card: C.danger,
  other: C.muted, streaming: C.accent, music: C.teal, fitness: C.warning,
  software: C.purple, gaming: C.pink, news: C.cyan,
};
const RISK_CFG = {
  LOW: { color: C.safe, label: 'Low Risk', desc: 'Obligations well within income.' },
  MEDIUM: { color: C.warning, label: 'Medium Risk', desc: 'Obligations are moderate. Monitor.' },
  HIGH: { color: C.danger, label: 'High Risk', desc: 'Obligations high vs income. Review.' },
};

// ─── Shared tooltip style ─────────────────────────────────────────────────────
const ttStyle = { backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 12 };

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${className}`} style={{ background: C.surface, borderColor: C.border }}>
      {children}
    </div>
  );
}
function CardTitle({ icon: Icon, title, color = C.accent }: any) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4" style={{ color }} />
      <h3 className="font-bold text-sm">{title}</h3>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color, icon: Icon, currency }: any) {
  const displayValue = typeof value === 'number' ? formatCurrency(value, currency) : value;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 border" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '22' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black mb-0.5">{displayValue}</p>
      {sub && <p className="text-xs" style={{ color: C.muted }}>{sub}</p>}
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...ttStyle, padding: '10px 14px' }}>
      <p className="font-bold text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? formatCurrency(p.value, currency) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Report Generator ─────────────────────────────────────────────────────────
function generateReport(data: InsightsData): string {
  const now = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const risk = RISK_CFG[data.spendingRiskLevel];

  const kpiRow = (label: string, value: string, color: string) =>
    `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value" style="color:${color}">${value}</div></div>`;

  const tableRow = (cells: string[]) =>
    `<tr>${cells.map((c, i) => `<td${i === 0 ? '' : ' class="num"'}>${c}</td>`).join('')}</tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AffordIQ Analytics Report — ${now}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Inter,sans-serif;background:#0f1117;color:#f0f4ff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:960px;margin:0 auto;padding:40px 32px}
  /* Header */
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid #1e2535;margin-bottom:32px}
  .logo{display:flex;align-items:center;gap:12px}
  .logo-icon{width:44px;height:44px;border-radius:12px;background:#3b6ef8;display:flex;align-items:center;justify-content:center;font-size:22px}
  .logo-name{font-size:24px;font-weight:900;letter-spacing:-.5px}
  .logo-sub{font-size:12px;color:#5a6480;margin-top:2px}
  .date{font-size:12px;color:#5a6480;text-align:right}
  /* Sections */
  h2{font-size:18px;font-weight:800;margin:32px 0 16px;display:flex;align-items:center;gap:8px}
  h2 .num{width:28px;height:28px;border-radius:8px;background:#3b6ef8;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
  /* KPI grid */
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:28px}
  .kpi{background:#161b27;border:1px solid #1e2535;border-radius:14px;padding:18px}
  .kpi-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#5a6480;margin-bottom:8px}
  .kpi-value{font-size:22px;font-weight:900}
  /* Tables */
  table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
  th{text-align:left;padding:10px 14px;background:#161b27;border-bottom:2px solid #1e2535;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#5a6480}
  td{padding:10px 14px;border-bottom:1px solid #1e2535;color:#a8b4cc}
  td.num{text-align:right;font-weight:600;color:#f0f4ff}
  tr:last-child td{border-bottom:none}
  /* Badges */
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
  .badge-safe{background:#052e16;color:#22c55e}
  .badge-risky{background:#1c1300;color:#f59e0b}
  .badge-danger{background:#2d0a0a;color:#ef4444}
  /* Risk meter */
  .risk-bar{height:12px;border-radius:6px;background:#1e2535;overflow:hidden;margin:8px 0}
  .risk-fill{height:100%;border-radius:6px;transition:width .5s}
  /* Waterfall bars */
  .wf-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px}
  .wf-label{width:140px;flex-shrink:0;color:#a8b4cc}
  .wf-bar-wrap{flex:1;background:#1e2535;border-radius:4px;height:24px;overflow:hidden;position:relative}
  .wf-bar{height:100%;border-radius:4px;display:flex;align-items:center;padding:0 8px;font-size:11px;font-weight:700;color:#fff}
  .wf-amount{width:90px;text-align:right;font-weight:700;font-size:13px}
  /* Cashflow table */
  .cf-event{font-size:11px;color:#5a6480}
  /* Footer */
  .footer{margin-top:48px;padding-top:20px;border-top:1px solid #1e2535;text-align:center;font-size:11px;color:#5a6480}
  @media print{body{background:#0f1117!important}.page{padding:24px}}
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="logo">
      <div class="logo-icon">⚡</div>
      <div>
        <div class="logo-name">AffordIQ</div>
        <div class="logo-sub">Analytics Report</div>
      </div>
    </div>
    <div class="date">Generated: ${now}<br>Real-Time Affordability Engine</div>
  </div>

  <!-- KPIs -->
  <div class="kpi-grid">
    ${kpiRow('Monthly Income', `$${data.monthlyIncome.toLocaleString()}`, C.accent)}
    ${kpiRow('Current Balance', `$${data.currentBalance.toLocaleString()}`, C.safe)}
    ${kpiRow('Total Obligations', `$${data.totalObligations.toLocaleString()}`, C.danger)}
    ${kpiRow('Free Cash Flow', `$${data.freeCashFlow.toLocaleString()}`, data.freeCashFlow >= 0 ? C.safe : C.danger)}
    ${kpiRow('Spending Ratio', `${data.spendingRatio}%`, risk.color)}
    ${kpiRow('Checks Run', `${data.totalChecks}`, C.accent)}
    ${kpiRow('Avg Score', `${data.avgScore}/100`, data.avgScore >= 70 ? C.safe : data.avgScore >= 40 ? C.warning : C.danger)}
    ${kpiRow('Avg Purchase', `$${data.avgPurchaseAmount}`, C.muted)}
  </div>

  <!-- Section 1: Cash Flow Waterfall -->
  <h2><span class="num">01</span> Monthly Cash Flow Waterfall</h2>
  ${data.waterfallData.map(row => {
    const maxVal = data.monthlyIncome;
    const pct = Math.abs(row.value) / maxVal * 100;
    const color = row.type === 'income' ? C.accent : row.type === 'result' ? (row.value >= 0 ? C.safe : C.danger) : C.danger;
    return `<div class="wf-row">
      <div class="wf-label">${row.name}</div>
      <div class="wf-bar-wrap">
        <div class="wf-bar" style="width:${Math.min(pct, 100)}%;background:${color}">
          ${pct > 15 ? (row.type === 'income' ? `+$${row.value.toLocaleString()}` : `${row.value < 0 ? '-' : '+'}$${Math.abs(row.value).toLocaleString()}`) : ''}
        </div>
      </div>
      <div class="wf-amount" style="color:${color}">${row.value >= 0 ? '+' : ''}$${row.value.toLocaleString()}</div>
    </div>`;
  }).join('')}

  <!-- Section 2: Spending Risk -->
  <h2><span class="num">02</span> Spending Risk Analysis</h2>
  <table>
    <thead><tr><th>Metric</th><th>Value</th><th>Status</th></tr></thead>
    <tbody>
      ${tableRow(['Spending Ratio', `${data.spendingRatio}%`, `<span class="badge badge-${data.spendingRiskLevel === 'LOW' ? 'safe' : data.spendingRiskLevel === 'MEDIUM' ? 'risky' : 'danger'}">${risk.label}</span>`])}
      ${tableRow(['Total Obligations', `$${data.totalObligations.toLocaleString()}`, `${(data.totalObligations / data.monthlyIncome * 100).toFixed(1)}% of income`])}
      ${tableRow(['Free Cash Flow', `$${data.freeCashFlow.toLocaleString()}`, data.freeCashFlow >= 0 ? '<span class="badge badge-safe">Positive</span>' : '<span class="badge badge-danger">Negative</span>'])}
      ${tableRow(['Safety Buffer', `$${data.safetyBuffer.toLocaleString()}`, 'Protected reserve'])}
      ${tableRow(['Savings Goal', `$${data.savingsGoal.toLocaleString()}/mo`, 'Monthly target'])}
    </tbody>
  </table>
  <div class="risk-bar"><div class="risk-fill" style="width:${Math.min(data.spendingRatio, 100)}%;background:${risk.color}"></div></div>
  <p style="font-size:12px;color:#5a6480;margin-bottom:24px">${risk.desc}</p>

  <!-- Section 3: Bills -->
  <h2><span class="num">03</span> Fixed Bills & Expenses</h2>
  <table>
    <thead><tr><th>Bill</th><th>Category</th><th>Due Day</th><th>Monthly Amount</th><th>Annual Cost</th></tr></thead>
    <tbody>
      ${data.billsData.sort((a, b) => b.amount - a.amount).map(b =>
    tableRow([b.name, b.category?.replace('_', ' '), `Day ${b.due_day}`, `$${b.amount.toLocaleString()}`, `$${(b.amount * 12).toLocaleString()}`])
  ).join('')}
      <tr style="border-top:2px solid #1e2535"><td style="font-weight:700;color:#f0f4ff">TOTAL</td><td></td><td></td><td class="num">$${data.totalFixedExpenses.toLocaleString()}</td><td class="num">$${(data.totalFixedExpenses * 12).toLocaleString()}</td></tr>
    </tbody>
  </table>

  <!-- Section 4: Subscriptions -->
  <h2><span class="num">04</span> Subscriptions</h2>
  <table>
    <thead><tr><th>Service</th><th>Category</th><th>Billing</th><th>Monthly</th><th>Annual</th></tr></thead>
    <tbody>
      ${data.subsData.sort((a, b) => b.amount - a.amount).map(s =>
    tableRow([s.name, s.category, 'Monthly', `$${s.amount.toFixed(2)}`, `$${s.annual.toFixed(2)}`])
  ).join('')}
      <tr style="border-top:2px solid #1e2535"><td style="font-weight:700;color:#f0f4ff">TOTAL</td><td></td><td></td><td class="num">$${data.totalSubscriptions.toFixed(2)}</td><td class="num">$${(data.totalSubscriptions * 12).toFixed(2)}</td></tr>
    </tbody>
  </table>

  <!-- Section 5: Affordability Checks -->
  <h2><span class="num">05</span> Affordability Check History</h2>
  <table>
    <thead><tr><th>Decision</th><th>Count</th><th>% of Total</th></tr></thead>
    <tbody>
      ${tableRow(['SAFE', `${data.decisionBreakdown.safe}`, data.totalChecks > 0 ? `${(data.decisionBreakdown.safe / data.totalChecks * 100).toFixed(0)}%` : '0%'])}
      ${tableRow(['RISKY', `${data.decisionBreakdown.risky}`, data.totalChecks > 0 ? `${(data.decisionBreakdown.risky / data.totalChecks * 100).toFixed(0)}%` : '0%'])}
      ${tableRow(['NOT RECOMMENDED', `${data.decisionBreakdown.not_recommended}`, data.totalChecks > 0 ? `${(data.decisionBreakdown.not_recommended / data.totalChecks * 100).toFixed(0)}%` : '0%'])}
      <tr style="border-top:2px solid #1e2535"><td style="font-weight:700;color:#f0f4ff">TOTAL</td><td class="num">${data.totalChecks}</td><td class="num">Avg Score: ${data.avgScore}/100</td></tr>
    </tbody>
  </table>

  <!-- Section 6: Category Spend -->
  ${data.categorySpend.length > 0 ? `
  <h2><span class="num">06</span> Spend by Category</h2>
  <table>
    <thead><tr><th>Category</th><th>Checks</th><th>Total Spend</th><th>Safe</th><th>Risky</th><th>Not Rec.</th></tr></thead>
    <tbody>
      ${data.categorySpend.sort((a, b) => b.amount - a.amount).map(c =>
    tableRow([c.category, `${c.total}`, `$${c.amount.toLocaleString()}`,
    `<span class="badge badge-safe">${c.safe}</span>`,
    `<span class="badge badge-risky">${c.risky}</span>`,
    `<span class="badge badge-danger">${c.not_recommended}</span>`])
  ).join('')}
    </tbody>
  </table>` : ''}

  <!-- Section 7: 30-Day Cash Flow -->
  <h2><span class="num">07</span> 30-Day Cash Flow Projection</h2>
  <table>
    <thead><tr><th>Day</th><th>Events</th><th>Income</th><th>Expenses</th><th>Balance</th><th>Status</th></tr></thead>
    <tbody>
      ${data.cashflowProjection.filter(d => d.events || d.income > 0 || d.expenses > 0).map(d =>
    `<tr>
          <td>Day ${d.day}</td>
          <td class="cf-event">${d.events || '—'}</td>
          <td class="num" style="color:${C.safe}">${d.income > 0 ? `+$${d.income.toLocaleString()}` : '—'}</td>
          <td class="num" style="color:${C.danger}">${d.expenses > 0 ? `-$${d.expenses.toLocaleString()}` : '—'}</td>
          <td class="num" style="color:${d.balance < 0 ? C.danger : d.aboveBuffer ? C.text : C.warning}">$${d.balance.toLocaleString()}</td>
          <td>${d.aboveBuffer ? '<span class="badge badge-safe">Safe</span>' : '<span class="badge badge-danger">Below Buffer</span>'}</td>
        </tr>`
  ).join('')}
    </tbody>
  </table>

  <!-- Section 8: Monthly Trend -->
  <h2><span class="num">08</span> Monthly Affordability Trend</h2>
  <table>
    <thead><tr><th>Month</th><th>Total Checks</th><th>Safe</th><th>Risky</th><th>Not Rec.</th><th>Avg Score</th><th>Total Spend</th></tr></thead>
    <tbody>
      ${data.trend.map(t =>
    tableRow([t.month, `${t.total_checks}`,
    `<span class="badge badge-safe">${t.safe}</span>`,
    `<span class="badge badge-risky">${t.risky}</span>`,
    `<span class="badge badge-danger">${t.not_recommended}</span>`,
    t.avg_score > 0 ? `${t.avg_score}/100` : '—',
    t.total_spend > 0 ? `$${t.total_spend.toLocaleString()}` : '—'])
  ).join('')}
    </tbody>
  </table>

  <div class="footer">
    AffordIQ Analytics Report · Generated ${now} · Real-Time Affordability Engine<br>
    This report reflects your current financial profile and check history from the AffordIQ database.
  </div>
</div>
</body>
</html>`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [downloading, setDownloading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const { session } = useAuth();

  const fetchData = () => {
    setLoading(true);
    setError(null);

    const headers = { 'Authorization': `Bearer ${session?.access_token}` };
    
    Promise.all([
      fetch('/api/insights', { headers }).then(r => r.json()),
      fetch('/api/profile', { headers }).then(r => r.json())
    ]).then(([d, p]) => {
      if (d.error) {
        setError(d.error);
      } else {
        setData(d);
        if (p && p.currency) setCurrency(p.currency);
      }
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const handleDownload = () => {
    if (!data) return;
    setDownloading(true);
    try {
      const html = generateReport(data);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AffordIQ_Report_${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: C.accent, borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 p-6 text-center">
      <AlertTriangle className="w-12 h-12" style={{ color: C.danger }} />
      <h2 className="text-xl font-bold">Failed to load analytics</h2>
      <p className="text-sm max-w-md" style={{ color: C.muted }}>{error}</p>
      <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-slate-800 font-semibold mt-2">Try Again</button>
    </div>
  );

  if (!data || data.empty) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <BarChart3 className="w-12 h-12" style={{ color: C.muted }} />
      <p className="font-semibold">No data yet. Set up your profile first.</p>
    </div>
  );

  const risk = RISK_CFG[data.spendingRiskLevel];
  const decisionPie = [
    { name: 'Safe', value: data.decisionBreakdown.safe, color: C.safe },
    { name: 'Risky', value: data.decisionBreakdown.risky, color: C.warning },
    { name: 'Not Recommended', value: data.decisionBreakdown.not_recommended, color: C.danger },
  ];
  const obligationPie = [
    { name: 'Fixed Bills', value: data.totalFixedExpenses, color: C.danger },
    { name: 'Subscriptions', value: data.totalSubscriptions, color: C.warning },
    { name: 'Savings Goal', value: data.savingsGoal, color: C.safe },
    { name: 'Safety Buffer', value: data.safetyBuffer, color: C.purple },
    { name: 'Free Cash', value: Math.max(data.freeCashFlow, 0), color: C.teal },
  ];

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'cashflow', label: 'Cash Flow' },
    { id: 'bills', label: 'Bills' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'checks', label: 'Checks' },
    { id: 'trend', label: 'Trend' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">Analytics Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Full financial analytics with downloadable report</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: C.border, color: C.muted }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: C.accent }}>
            <Download className="w-4 h-4" />
            {downloading ? 'Generating…' : 'Download Report'}
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: activeSection === s.id ? C.accent : C.surface,
              color: activeSection === s.id ? '#fff' : C.muted,
              border: `1px solid ${activeSection === s.id ? C.accent : C.border}`,
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {activeSection === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Monthly Income" value={data.monthlyIncome} currency={currency} sub={currency} color={C.accent} icon={TrendingUp} />
            <KPI label="Current Balance" value={data.currentBalance} currency={currency} sub="Available" color={C.safe} icon={DollarSign} />
            <KPI label="Free Cash Flow" value={data.freeCashFlow} currency={currency} sub="After obligations" color={data.freeCashFlow >= 0 ? C.safe : C.danger} icon={data.freeCashFlow >= 0 ? TrendingUp : TrendingDown} />
            <KPI label="Spending Ratio" value={`${data.spendingRatio}%`} sub={risk.label} color={risk.color} icon={PieIcon} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Total Obligations" value={data.totalObligations} currency={currency} sub="Bills+subs+savings" color={C.danger} icon={AlertTriangle} />
            <KPI label="Safety Buffer" value={data.safetyBuffer} currency={currency} sub="Protected" color={C.purple} icon={Shield} />
            <KPI label="Total Checks" value={`${data.totalChecks}`} sub="Affordability runs" color={C.accent} icon={Zap} />
            <KPI label="Avg Score" value={`${data.avgScore}/100`} sub="Affordability score" color={data.avgScore >= 70 ? C.safe : data.avgScore >= 40 ? C.warning : C.danger} icon={Target} />
          </div>

          {/* Waterfall + Obligation pie */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle icon={BarChart3} title="Monthly Cash Flow Waterfall" />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.waterfallData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => formatCurrency(v, currency)} />
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.waterfallData.map((entry, i) => (
                      <Cell key={i} fill={entry.type === 'income' ? C.accent : entry.type === 'result' ? (entry.value >= 0 ? C.safe : C.danger) : C.danger} />
                    ))}
                    <LabelList dataKey="value" position="top" formatter={(v: any) => `$${Math.abs(v / 1000).toFixed(1)}k`}
                      style={{ fill: C.muted, fontSize: 10 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle icon={PieIcon} title="Income Allocation" />
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={obligationPie} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {obligationPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`$${v.toLocaleString()}`, '']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: C.muted }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Decision donut + Risk gauge */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardTitle icon={Zap} title="Decision Distribution" color={C.accent} />
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={decisionPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" nameKey="name" paddingAngle={4}>
                    {decisionPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: C.muted }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {[
                  { label: 'SAFE', count: data.decisionBreakdown.safe, color: C.safe },
                  { label: 'RISKY', count: data.decisionBreakdown.risky, color: C.warning },
                  { label: 'NOT REC.', count: data.decisionBreakdown.not_recommended, color: C.danger },
                ].map(({ label, count, color }) => {
                  const pct = data.totalChecks > 0 ? count / data.totalChecks * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span style={{ color }}>{label}</span>
                        <span style={{ color: C.muted }}>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: C.border }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardTitle icon={AlertTriangle} title="Spending Risk Breakdown" color={risk.color} />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 flex-shrink-0"
                  style={{ borderColor: risk.color, background: risk.color + '18' }}>
                  <div className="text-center">
                    <p className="text-lg font-black" style={{ color: risk.color }}>{data.spendingRatio}%</p>
                    <p className="text-xs" style={{ color: C.muted }}>ratio</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: risk.color }}>{risk.label}</p>
                  <p className="text-xs mt-1" style={{ color: C.muted }}>{risk.desc}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[
                  { name: 'Fixed Bills', value: data.totalFixedExpenses, pct: data.totalFixedExpenses / data.monthlyIncome * 100 },
                  { name: 'Subscriptions', value: data.totalSubscriptions, pct: data.totalSubscriptions / data.monthlyIncome * 100 },
                  { name: 'Savings Goal', value: data.savingsGoal, pct: data.savingsGoal / data.monthlyIncome * 100 },
                  { name: 'Safety Buffer', value: data.safetyBuffer, pct: data.safetyBuffer / data.monthlyIncome * 100 },
                ]} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 90 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: C.muted, fontSize: 10 }}
                    tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={88} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`${v.toFixed(1)}%`, '% of income']} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {[C.danger, C.warning, C.safe, C.purple].map((color, i) => <Cell key={i} fill={color} />)}
                    <LabelList dataKey="pct" position="right" formatter={(v: any) => `${v.toFixed(1)}%`}
                      style={{ fill: C.muted, fontSize: 10 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── CASH FLOW ────────────────────────────────────────────────────────── */}
      {activeSection === 'cashflow' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Card>
            <CardTitle icon={TrendingUp} title="30-Day Balance Projection" color={C.accent} />
            <p className="text-xs mb-4" style={{ color: C.muted }}>
              Simulates your balance day-by-day accounting for all bills, subscriptions, and payday.
              ▼ = bill payment &nbsp; ★ = payday &nbsp; ✕ = below safety buffer
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.cashflowProjection} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `D${v}`} interval={4} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip contentStyle={ttStyle}
                  formatter={(v: any) => [`$${v.toLocaleString()}`, '']}
                  labelFormatter={l => `Day ${l}`} />
                <ReferenceLine y={data.safetyBuffer} stroke={C.danger} strokeDasharray="4 4" strokeOpacity={0.7}
                  label={{ value: `Buffer $${data.safetyBuffer}`, fill: C.danger, fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine y={0} stroke={C.muted} strokeOpacity={0.4} />
                <Area type="monotone" dataKey="balance" name="Balance" stroke={C.accent} strokeWidth={2.5}
                  fill="url(#balGrad)" dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.income > 0) return <circle key={cy} cx={cx} cy={cy} r={5} fill={C.safe} stroke={C.base} strokeWidth={1.5} />;
                    if (payload.expenses > 0) return <circle key={cy} cx={cx} cy={cy} r={4} fill={C.warning} stroke={C.base} strokeWidth={1.5} />;
                    return <g key={cy} />;
                  }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle icon={Calendar} title="Daily Income & Expenses" color={C.safe} />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.cashflowProjection.filter(d => d.income > 0 || d.expenses > 0)}
                  margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `D${v}`} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${Math.abs(v / 1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={ttStyle} labelFormatter={l => `Day ${l}`}
                    formatter={(v: any) => [`$${Math.abs(v).toLocaleString()}`, '']} />
                  <Bar dataKey="income" name="Income" fill={C.safe} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill={C.danger} radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle icon={AlertTriangle} title="Days Below Safety Buffer" color={C.danger} />
              <div className="space-y-2 mt-2">
                {data.cashflowProjection.filter(d => !d.aboveBuffer).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <ShieldCheck className="w-10 h-10" style={{ color: C.safe }} />
                    <p className="font-semibold text-sm" style={{ color: C.safe }}>Balance stays above buffer all month!</p>
                  </div>
                ) : (
                  data.cashflowProjection.filter(d => !d.aboveBuffer).map(d => (
                    <div key={d.day} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: C.base, border: `1px solid ${C.danger}30` }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.danger }}>Day {d.day}</p>
                        {d.events && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{d.events}</p>}
                      </div>
                      <span className="font-black text-sm" style={{ color: C.danger }}>${d.balance.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── BILLS ────────────────────────────────────────────────────────────── */}
      {activeSection === 'bills' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle icon={CreditCard} title="Bills by Amount" color={C.accent} />
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...data.billsData].sort((a, b) => b.amount - a.amount)}
                  layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={98} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`$${v}`, 'Monthly']} />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {data.billsData.sort((a, b) => b.amount - a.amount).map((entry, i) => (
                      <Cell key={i} fill={CAT_COLORS[entry.category] || C.muted} />
                    ))}
                    <LabelList dataKey="amount" position="right" formatter={(v: any) => `$${v}`}
                      style={{ fill: C.muted, fontSize: 10 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle icon={PieIcon} title="Bills by Category" color={C.purple} />
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={Object.entries(data.billsByCategory).map(([cat, amt]) => ({
                    name: cat.replace('_', ' '), value: amt, color: CAT_COLORS[cat] || C.muted
                  }))} cx="50%" cy="50%" innerRadius={65} outerRadius={110}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {Object.entries(data.billsByCategory).map(([cat], i) => (
                      <Cell key={i} fill={CAT_COLORS[cat] || C.muted} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`$${v.toLocaleString()}`, '']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: C.muted }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <CardTitle icon={Calendar} title="Bill Due Date Calendar" color={C.warning} />
            <p className="text-xs mb-4" style={{ color: C.muted }}>Each bubble represents a bill due on that day of the month. Size = amount.</p>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" dataKey="due_day" domain={[0, 32]} name="Day" tick={{ fill: C.muted, fontSize: 11 }}
                  axisLine={false} tickLine={false} label={{ value: 'Day of Month', fill: C.muted, fontSize: 11, position: 'insideBottom', offset: -4 }} />
                <YAxis type="number" dataKey="amount" name="Amount" tick={{ fill: C.muted, fontSize: 11 }}
                  axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={ttStyle} cursor={{ strokeDasharray: '3 3' }}
                  formatter={(v: any) => [`$${v}`, '']} />
                <Scatter data={data.billsData} name="Bills">
                  {data.billsData.map((entry, i) => (
                    <Cell key={i} fill={CAT_COLORS[entry.category] || C.muted} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* ── SUBSCRIPTIONS ────────────────────────────────────────────────────── */}
      {activeSection === 'subscriptions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle icon={Repeat} title="Monthly Subscription Costs" color={C.warning} />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...data.subsData].sort((a, b) => b.amount - a.amount)}
                  margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`$${v}`, 'Monthly']} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {data.subsData.sort((a, b) => b.amount - a.amount).map((entry, i) => (
                      <Cell key={i} fill={CAT_COLORS[entry.category] || C.muted} />
                    ))}
                    <LabelList dataKey="amount" position="top" formatter={(v: any) => `$${v}`}
                      style={{ fill: C.muted, fontSize: 10 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle icon={TrendingUp} title="Monthly vs Annual Cost" color={C.teal} />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.subsData.sort((a, b) => b.annual - a.annual)}
                  margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`$${v.toFixed(2)}`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
                  <Bar dataKey="amount" name="Monthly" fill={C.warning} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="annual" name="Annual" fill={C.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle icon={Activity} title="Subscription Summary" color={C.accent} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.subsData.map(sub => (
                <div key={sub.name} className="p-4 rounded-xl text-center" style={{ background: C.base }}>
                  <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                    style={{ background: (CAT_COLORS[sub.category] || C.muted) + '25' }}>
                    <Repeat className="w-4 h-4" style={{ color: CAT_COLORS[sub.category] || C.muted }} />
                  </div>
                  <p className="text-sm font-semibold truncate">{sub.name}</p>
                  <p className="text-lg font-black mt-1" style={{ color: C.accent }}>${sub.amount.toFixed(2)}</p>
                  <p className="text-xs" style={{ color: C.muted }}>${sub.annual.toFixed(0)}/yr</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: C.border }}>
              <span className="text-sm font-semibold">Total</span>
              <div className="text-right">
                <span className="font-black" style={{ color: C.warning }}>${data.totalSubscriptions.toFixed(2)}/mo</span>
                <span className="text-xs ml-2" style={{ color: C.muted }}>(${(data.totalSubscriptions * 12).toFixed(0)}/yr)</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── CHECKS ───────────────────────────────────────────────────────────── */}
      {activeSection === 'checks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle icon={BarChart3} title="Score Distribution" color={C.accent} />
              <p className="text-xs mb-3" style={{ color: C.muted }}>
                <span style={{ color: C.danger }}>■</span> Not Rec. (0–39) &nbsp;
                <span style={{ color: C.warning }}>■</span> Risky (40–69) &nbsp;
                <span style={{ color: C.safe }}>■</span> Safe (70–100)
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.scoreBuckets} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="range" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="safe" name="Safe" stackId="a" fill={C.safe} />
                  <Bar dataKey="risky" name="Risky" stackId="a" fill={C.warning} />
                  <Bar dataKey="not_recommended" name="Not Rec." stackId="a" fill={C.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle icon={Zap} title="Amount vs Score" color={C.warning} />
              <p className="text-xs mb-3" style={{ color: C.muted }}>Each dot = one affordability check. Higher amount → lower score.</p>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis type="number" dataKey="amount" name="Amount" tick={{ fill: C.muted, fontSize: 10 }}
                    axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}
                    label={{ value: 'Purchase Amount ($)', fill: C.muted, fontSize: 10, position: 'insideBottom', offset: -4 }} />
                  <YAxis type="number" dataKey="score" name="Score" domain={[0, 100]}
                    tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={70} stroke={C.safe} strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: 'SAFE', fill: C.safe, fontSize: 9, position: 'right' }} />
                  <ReferenceLine y={40} stroke={C.warning} strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: 'RISKY', fill: C.warning, fontSize: 9, position: 'right' }} />
                  <Tooltip contentStyle={ttStyle}
                    formatter={(v: any) => [`${v}`, '']}
                    labelFormatter={() => ''} />
                  <Scatter data={data.checksScatter} name="Checks">
                    {data.checksScatter.map((entry, i) => (
                      <Cell key={i} fill={entry.decision === 'SAFE' ? C.safe : entry.decision === 'RISKY' ? C.warning : C.danger} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {data.categorySpend.length > 0 && (
            <Card>
              <CardTitle icon={PieIcon} title="Checks by Purchase Category" color={C.purple} />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.categorySpend.sort((a, b) => b.total - a.total)}
                  margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="category" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
                  <Bar dataKey="safe" name="Safe" stackId="a" fill={C.safe} />
                  <Bar dataKey="risky" name="Risky" stackId="a" fill={C.warning} />
                  <Bar dataKey="not_recommended" name="Not Rec." stackId="a" fill={C.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </motion.div>
      )}

      {/* ── TREND ────────────────────────────────────────────────────────────── */}
      {activeSection === 'trend' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Card>
            <CardTitle icon={TrendingUp} title="Monthly Affordability Trend (Last 6 Months)" color={C.accent} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.trend} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                <Bar dataKey="safe" name="Safe" stackId="a" fill={C.safe} />
                <Bar dataKey="risky" name="Risky" stackId="a" fill={C.warning} />
                <Bar dataKey="not_recommended" name="Not Rec." stackId="a" fill={C.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle icon={Target} title="Monthly Avg Affordability Score" color={C.safe} />
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.trend} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`${v}/100`, 'Avg Score']} />
                  <ReferenceLine y={70} stroke={C.safe} strokeDasharray="4 4" strokeOpacity={0.5} />
                  <ReferenceLine y={40} stroke={C.warning} strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="avg_score" name="Avg Score" stroke={C.accent} strokeWidth={2.5}
                    dot={{ fill: C.accent, r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle icon={DollarSign} title="Monthly Total Spend Checked" color={C.warning} />
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.trend} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.warning} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`$${v.toLocaleString()}`, 'Total Spend']} />
                  <Area type="monotone" dataKey="total_spend" name="Total Spend" stroke={C.warning} strokeWidth={2.5}
                    fill="url(#spendGrad)" dot={{ fill: C.warning, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Summary table */}
          <Card>
            <CardTitle icon={BarChart3} title="Monthly Summary Table" color={C.muted} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: C.border }}>
                    {['Month', 'Checks', 'Safe', 'Risky', 'Not Rec.', 'Avg Score', 'Total Spend'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.trend.map((t, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: C.border + '60' }}>
                      <td className="py-2.5 px-3 font-semibold">{t.month}</td>
                      <td className="py-2.5 px-3" style={{ color: C.muted }}>{t.total_checks}</td>
                      <td className="py-2.5 px-3"><span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: C.safe + '20', color: C.safe }}>{t.safe}</span></td>
                      <td className="py-2.5 px-3"><span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: C.warning + '20', color: C.warning }}>{t.risky}</span></td>
                      <td className="py-2.5 px-3"><span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: C.danger + '20', color: C.danger }}>{t.not_recommended}</span></td>
                      <td className="py-2.5 px-3" style={{ color: t.avg_score >= 70 ? C.safe : t.avg_score >= 40 ? C.warning : t.avg_score > 0 ? C.danger : C.muted }}>
                        {t.avg_score > 0 ? `${t.avg_score}/100` : '—'}</td>
                      <td className="py-2.5 px-3 font-semibold">{t.total_spend > 0 ? `$${t.total_spend.toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
