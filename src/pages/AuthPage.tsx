import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function AuthPage() {
  const [params] = useSearchParams();
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Already logged in → go to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@affordiq.com');
    setPassword('demo1234');
    if (mode === 'signup') setMode('signin');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">AffordIQ</span>
        </Link>

        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 border"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-subtle)' }}>
              <Zap className="w-3 h-3" /> Real-Time Affordability Engine
            </div>
            <h2 className="text-4xl font-black leading-tight mb-5">
              Know before<br />you spend.
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
              AffordIQ checks your bills, subscriptions, and savings goals to give you an honest answer — before you tap "buy".
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { verdict: 'SAFE', color: 'var(--safe)', bg: 'var(--safe-subtle)', desc: 'Balance stays above your buffer' },
              { verdict: 'RISKY', color: 'var(--warning)', bg: 'var(--warning-subtle)', desc: 'Limited breathing room before payday' },
              { verdict: 'NOT RECOMMENDED', color: 'var(--danger)', bg: 'var(--danger-subtle)', desc: 'Risk of missing a bill or overdraft' },
            ].map(({ verdict, color, bg, desc }, i) => (
              <motion.div key={verdict}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: bg, borderColor: color + '30' }}>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg" style={{ background: color, color: 'white' }}>{verdict}</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AffordIQ · Portfolio Project · MIT License</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black tracking-tight">AffordIQ</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-black mb-1">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {mode === 'signin'
                  ? 'Sign in to your AffordIQ account'
                  : 'Start checking affordability in seconds'}
              </p>
            </div>

            {/* Demo shortcut */}
            <button
              type="button"
              onClick={fillDemo}
              className="w-full mb-5 py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-subtle)' }}
            >
              <Zap className="w-3.5 h-3.5" /> Use demo account
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or continue with email</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email" autoComplete="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-blue-500"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="Min. 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-blue-500"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password (signup only) */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password" placeholder="Repeat password"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-blue-500"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error / Success */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl text-sm"
                    style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl text-sm"
                    style={{ background: 'var(--safe-subtle)', color: 'var(--safe)' }}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                  : mode === 'signin' ? 'Sign In' : 'Create Account'
                }
              </button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
                className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}
              >
                {mode === 'signin' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
