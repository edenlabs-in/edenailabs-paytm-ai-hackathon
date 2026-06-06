import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Search,
  Brain,
  Phone,
  Kanban,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover', icon: Search, label: 'Discover Merchants' },
  { to: '/strategy', icon: Brain, label: 'AI Strategy' },
  { to: '/outreach', icon: Phone, label: 'Outreach' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <span className="font-display text-3xl font-extrabold tracking-tighter lowercase leading-none">
            <span className="text-primary">pay</span><span className="text-accent">tm</span>
          </span>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
            </NavLink>
          ))}
        </nav>

        {/* User + Sign out */}
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.full_name || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.plan || 'Free'} plan</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center border-b border-border px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="ml-3 font-display text-2xl font-extrabold tracking-tighter lowercase">
            <span className="text-primary">pay</span><span className="text-accent">tm</span>
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
