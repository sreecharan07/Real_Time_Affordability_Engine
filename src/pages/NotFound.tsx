import { useNavigate } from 'react-router-dom';
import { Zap, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--accent-subtle)' }}>
        <Zap className="w-10 h-10" style={{ color: 'var(--accent)' }} />
      </div>
      <h1 className="text-6xl font-black mb-3" style={{ color: 'var(--accent)' }}>404</h1>
      <p className="text-xl font-bold mb-2">Page not found</p>
      <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--text-muted)' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}>
          <Home className="w-4 h-4" /> Home
        </button>
      </div>
    </div>
  );
}
