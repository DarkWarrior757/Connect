import { type ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Plus,
  LogIn,
  Settings,
  LogOut,
  Menu,
  X,
  Video,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/create', label: 'Create Meeting', icon: Plus },
  { to: '/join', label: 'Join Meeting', icon: LogIn },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col glass-panel border-r border-navy-700/50 p-4">
        <Link to="/dashboard" className="mb-8">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-accent-500/15 text-accent-300'
                    : 'text-navy-300 hover:bg-navy-700/40 hover:text-navy-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-navy-700/50 pt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar name={profile?.display_name ?? 'User'} avatarUrl={profile?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-100 truncate">
                {profile?.display_name ?? 'User'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden glass-panel border-b border-navy-700/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard">
          <Logo size="sm" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-navy-700/50 text-navy-200"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden glass-panel border-b border-navy-700/50 p-4 animate-slide-up">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? 'bg-accent-500/15 text-accent-300'
                      : 'text-navy-300 hover:bg-navy-700/40'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-300 hover:bg-navy-700/40"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-50">{title}</h1>
        {subtitle && <p className="text-navy-300 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="flex gap-2 lg:hidden mb-4">
      <Link to="/create" className="flex-1">
        <Button variant="primary" size="sm" className="w-full">
          <Video className="h-4 w-4" />
          New
        </Button>
      </Link>
      <Link to="/join" className="flex-1">
        <Button variant="outline" size="sm" className="w-full">
          <LogIn className="h-4 w-4" />
          Join
        </Button>
      </Link>
    </div>
  );
}
