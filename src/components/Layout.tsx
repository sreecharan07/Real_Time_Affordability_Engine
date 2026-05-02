import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, CheckCircle, BarChart3, History, Zap, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/check', icon: CheckCircle, label: 'Check' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/profile', icon: Wallet, label: 'Profile' },
  { to: '/history', icon: History, label: 'History' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  // Shorten email for display
  const displayEmail = user?.email
    ? user.email.length > 22 ? user.email.slice(0, 20) + '…' : user.email
    : '';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r flex-shrink-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {/* Logo — clicks go to home (/) */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 px-6 py-5 border-b text-left w-full transition-opacity hover:opacity-80"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight block" style={{ color: 'var(--text-primary)' }}>AffordIQ</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Affordability Engine</p>
          </div>
        </button>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'nav-active' : 'nav-inactive'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {user ? (
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)' }}>
                  <User className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{displayEmail}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Signed in</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}
              >
                <LogOut className="w-3 h-3" /> Sign out
              </button>
            </div>
          ) : (
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>DEMO MODE</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Sample data loaded</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <button onClick={handleLogoClick} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">AffordIQ</span>
        </button>
        <div className="flex items-center gap-2">
          {user && (
            <button onClick={handleSignOut} className="p-2 rounded-lg" style={{ color: 'var(--danger)' }}>
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--text-muted)' }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14" style={{ background: 'var(--bg-surface)' }}>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? 'nav-active' : 'nav-inactive'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          {user && (
            <div className="px-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs mb-2 px-1" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full"
                style={{ color: 'var(--danger)', background: 'var(--danger-subtle)' }}
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="lg:hidden h-14" />
        <Outlet />
      </main>
    </div>
  );
}
