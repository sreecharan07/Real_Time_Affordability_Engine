import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Wallet, CreditCard, Repeat, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { SUPPORTED_CURRENCIES } from '../lib/currency';

interface Profile {
  monthly_income: number;
  current_balance: number;
  savings_goal: number;
  safety_buffer: number;
  payday_date: number;
  currency: string;
}
interface Bill { id?: number; name: string; amount: string; due_day: string; category: string; is_recurring: boolean; }
interface Subscription { id?: number; name: string; amount: string; billing_cycle: string; category: string; }

const BILL_CATEGORIES = ['rent', 'utilities', 'insurance', 'phone', 'internet', 'groceries', 'transport', 'credit_card', 'other'];
const SUB_CATEGORIES = ['streaming', 'music', 'fitness', 'software', 'news', 'gaming', 'other'];

export default function Profile() {
  const [profile, setProfile] = useState<Profile>({
    monthly_income: 3200,
    current_balance: 1850,
    savings_goal: 250,
    safety_buffer: 300,
    payday_date: 1,
    currency: 'USD'
  });
  const [bills, setBills] = useState<Bill[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { session } = useAuth();

  const fetchData = () => {
    if (!session) return;
    const headers = { 'Authorization': `Bearer ${session.access_token}` };
    
    Promise.all([
      fetch('/api/profile', { headers }).then(r => r.json()),
      fetch('/api/bills', { headers }).then(r => r.json()),
      fetch('/api/subscriptions', { headers }).then(r => r.json()),
    ]).then(([p, b, s]) => {
      if (p) setProfile(p);
      setBills(Array.isArray(b) ? b.map((x: any) => ({ ...x, amount: String(x.amount), due_day: String(x.due_day) })) : []);
      setSubs(Array.isArray(s) ? s.map((x: any) => ({ ...x, amount: String(x.amount) })) : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const saveProfile = async () => {
    if (!session) return;
    setErrorMsg('');
    const res = await fetch('/api/profile', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }, 
      body: JSON.stringify(profile) 
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || 'Failed to save profile. Is RLS enabled in Supabase?');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addBill = () => setBills(b => [...b, { name: '', amount: '', due_day: '', category: 'other', is_recurring: true }]);
  const removeBill = async (idx: number, id?: number) => {
    if (!session) return;
    if (id) await fetch('/api/bills', { 
      method: 'DELETE', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }, 
      body: JSON.stringify({ id }) 
    });
    setBills(b => b.filter((_, i) => i !== idx));
  };
  const saveBill = async (bill: Bill) => {
    if (!session || !bill.name || !bill.amount || !bill.due_day) return;
    setErrorMsg('');
    const res = await fetch('/api/bills', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }, 
      body: JSON.stringify({ name: bill.name, amount: parseFloat(bill.amount), due_day: parseInt(bill.due_day), category: bill.category, is_recurring: bill.is_recurring }) 
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || 'Failed to save bill.');
      return;
    }
    fetchData();
  };

  const addSub = () => setSubs(s => [...s, { name: '', amount: '', billing_cycle: 'monthly', category: 'other' }]);
  const removeSub = async (idx: number, id?: number) => {
    if (!session) return;
    if (id) await fetch('/api/subscriptions', { 
      method: 'DELETE', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }, 
      body: JSON.stringify({ id }) 
    });
    setSubs(s => s.filter((_, i) => i !== idx));
  };
  const saveSub = async (sub: Subscription) => {
    if (!session || !sub.name || !sub.amount) return;
    setErrorMsg('');
    const res = await fetch('/api/subscriptions', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }, 
      body: JSON.stringify({ name: sub.name, amount: parseFloat(sub.amount), billing_cycle: sub.billing_cycle, category: sub.category }) 
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || 'Failed to save subscription.');
      return;
    }
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div>;

  const inputClass = "w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all";
  const inputStyle = { background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Financial Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure your income, bills, and savings goals</p>
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-semibold">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Core profile */}
      <div className="rounded-2xl p-6 border mb-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Wallet className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold">Core Financials</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preferred Currency</label>
            <select
              value={profile.currency}
              onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}
              className={inputClass} style={inputStyle}
            >
              {SUPPORTED_CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.flag} {curr.label}</option>
              ))}
            </select>
          </div>
          {[
            { label: 'Monthly Income', key: 'monthly_income' },
            { label: 'Current Balance', key: 'current_balance' },
            { label: 'Savings Goal (Monthly)', key: 'savings_goal' },
            { label: 'Safety Buffer', key: 'safety_buffer' },
            { label: 'Payday (day of month)', key: 'payday_date' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label} ({profile.currency})</label>
              <input
                type="number" value={(profile as any)[key]}
                onChange={e => setProfile(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                className={inputClass} style={inputStyle}
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveProfile}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
          style={{ background: saved ? 'var(--safe)' : 'var(--accent)' }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </div>

      {/* Bills */}
      <div className="rounded-2xl p-6 border mb-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-bold">Bills & Fixed Expenses</h2>
          </div>
          <button onClick={addBill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>
            <Plus className="w-3.5 h-3.5" /> Add Bill
          </button>
        </div>
        <div className="space-y-3">
          {bills.map((bill, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
              <input placeholder="Bill name" value={bill.name} onChange={e => setBills(b => b.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                className="col-span-3 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              <input placeholder="Amount" type="number" value={bill.amount} onChange={e => setBills(b => b.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))}
                className="col-span-2 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              <input placeholder="Day" type="number" min="1" max="31" value={bill.due_day} onChange={e => setBills(b => b.map((x, i) => i === idx ? { ...x, due_day: e.target.value } : x))}
                className="col-span-2 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              <select value={bill.category} onChange={e => setBills(b => b.map((x, i) => i === idx ? { ...x, category: e.target.value } : x))}
                className="col-span-3 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle}>
                {BILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {!bill.id ? (
                <button onClick={() => saveBill(bill)} className="col-span-1 p-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--safe)' }}>
                  <Save className="w-3.5 h-3.5" />
                </button>
              ) : <div className="col-span-1" />}
              <button onClick={() => removeBill(idx, bill.id)} className="col-span-1 p-1.5 rounded-lg" style={{ color: 'var(--danger)' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {bills.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No bills added yet</p>}
        </div>
      </div>

      {/* Subscriptions */}
      <div className="rounded-2xl p-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-bold">Subscriptions</h2>
          </div>
          <button onClick={addSub} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>
            <Plus className="w-3.5 h-3.5" /> Add Subscription
          </button>
        </div>
        <div className="space-y-3">
          {subs.map((sub, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
              <input placeholder="Service name" value={sub.name} onChange={e => setSubs(s => s.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                className="col-span-3 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              <input placeholder="Amount" type="number" value={sub.amount} onChange={e => setSubs(s => s.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))}
                className="col-span-2 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              <select value={sub.billing_cycle} onChange={e => setSubs(s => s.map((x, i) => i === idx ? { ...x, billing_cycle: e.target.value } : x))}
                className="col-span-3 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="weekly">Weekly</option>
              </select>
              <select value={sub.category} onChange={e => setSubs(s => s.map((x, i) => i === idx ? { ...x, category: e.target.value } : x))}
                className="col-span-2 px-2 py-1.5 rounded-lg border text-sm outline-none" style={inputStyle}>
                {SUB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {!sub.id ? (
                <button onClick={() => saveSub(sub)} className="col-span-1 p-1.5 rounded-lg" style={{ background: 'var(--safe)' }}>
                  <Save className="w-3.5 h-3.5 text-white" />
                </button>
              ) : <div className="col-span-1" />}
              <button onClick={() => removeSub(idx, sub.id)} className="col-span-1 p-1.5 rounded-lg" style={{ color: 'var(--danger)' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {subs.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No subscriptions added yet</p>}
        </div>
      </div>
    </div>
  );
}
