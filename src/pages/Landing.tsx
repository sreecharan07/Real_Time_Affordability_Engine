import { useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2, BarChart3, Wallet, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { icon: ShieldCheck, title: 'Smart Decision Engine', desc: 'Get SAFE, RISKY, or NOT RECOMMENDED verdicts in seconds based on your real financial picture.' },
    { icon: TrendingUp, title: 'Affordability Score', desc: 'A 0–100 score that factors in upcoming bills, subscriptions, savings goals, and your safety buffer.' },
    { icon: BarChart3, title: 'Financial Insights', desc: 'Visualize your free cash flow, spending risk, and obligation breakdown at a glance.' },
    { icon: Wallet, title: 'Bill & Subscription Tracking', desc: 'Track every recurring obligation so nothing catches you off guard before payday.' },
  ];

  const problems = [
    'You check your balance, it looks fine — then rent hits.',
    'You forget a subscription renewal and overdraft.',
    'You spend on dining out, then can\'t cover the phone bill.',
    'You have no idea what your "safe" spending limit actually is.',
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-30" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">AffordIQ</span>
        </div>

        {user ? (
          // Already logged in — show Go to Dashboard
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          // Not logged in — show Sign In + Create Account
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/auth?mode=signin')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-subtle)' }}>
            <Zap className="w-3 h-3" /> Real-Time Affordability Engine
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Can you really<br />
            <span style={{ color: 'var(--accent)' }}>afford that?</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-muted)' }}>
            AffordIQ analyzes your income, upcoming bills, subscriptions, and savings goals to give you an instant, honest answer before you spend.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 text-base"
              style={{ background: 'var(--accent)' }}
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth?mode=signin')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base border transition-all hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>No credit card required · Demo account available</p>
        </motion.div>
      </section>

      {/* Problem section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="rounded-2xl p-8 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--warning)' }} />
            <h2 className="text-2xl font-bold">The Problem</h2>
          </div>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Most people check their bank balance before spending — but that number alone is dangerously misleading.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {problems.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--danger)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-center mb-10">How AffordIQ Helps</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-subtle)' }}>
                <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Decision states */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Three Clear Answers</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { label: 'SAFE', desc: 'Purchase keeps you above your safety buffer with bills covered.', color: 'var(--safe)', bg: 'var(--safe-subtle)' },
            { label: 'RISKY', desc: 'Purchase is possible but leaves limited breathing room before payday.', color: 'var(--warning)', bg: 'var(--warning-subtle)' },
            { label: 'NOT RECOMMENDED', desc: 'Purchase would break your safety buffer or risk missing a bill.', color: 'var(--danger)', bg: 'var(--danger-subtle)' },
          ].map(({ label, desc, color, bg }) => (
            <div key={label} className="p-6 rounded-2xl border text-center" style={{ background: bg, borderColor: color + '40' }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black mb-4" style={{ background: color, color: 'white' }}>
                <CheckCircle2 className="w-4 h-4" />{label}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="rounded-2xl p-12" style={{ background: 'var(--accent)', backgroundImage: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}>
          <h2 className="text-3xl font-black text-white mb-4">Ready to spend smarter?</h2>
          <p className="text-white/80 mb-8">Create a free account and check your first purchase in under 30 seconds.</p>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90"
            style={{ background: 'white', color: 'var(--accent)' }}
          >
            Create Free Account →
          </button>
        </div>
      </section>

      <footer className="text-center py-8 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <p className="text-sm">AffordIQ — Real-Time Affordability Engine · Built for portfolio demonstration</p>
      </footer>
    </div>
  );
}
