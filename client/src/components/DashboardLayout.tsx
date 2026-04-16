import { ReactNode, useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Logo, ThemeToggle } from '@/components/Logo';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import type { INotification } from '@flowboard/shared';

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        api.get<{ notifications: INotification[] }>('/notifications'),
        api.get<{ count: number }>('/notifications/unread-count'),
      ]);
      setNotifications(list.data.notifications);
      setUnread(count.data.count);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useSocket((payload) => {
    setNotifications((prev) => [payload as INotification, ...prev]);
    setUnread((n) => n + 1);
  });

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function markAllRead() {
    await api.post('/notifications/mark-all-read');
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/board', label: 'Board', icon: KanbanSquare },
    { to: '/ai-tools', label: 'AI Tools', icon: Sparkles },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex bg-bg">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface shrink-0">
        <div className="p-5 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)]'
                    : 'text-fg-muted hover:bg-surface-alt hover:text-fg'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-fg-muted hover:bg-surface-alt hover:text-fg"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="md:hidden">
            <Logo size={28} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-fg hover:bg-surface-alt"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-card overflow-hidden z-40"
                  >
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <h3 className="font-display font-semibold text-sm text-fg">Notifications</h3>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs text-brand font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-fg-muted">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n._id}
                            className={clsx(
                              'p-3 border-b border-border last:border-0 hover:bg-surface-alt',
                              !n.read && 'bg-brand-50/40 dark:bg-brand-900/10'
                            )}
                          >
                            <p className="text-sm font-medium text-fg">{n.title}</p>
                            {n.body && <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">{n.body}</p>}
                            <p className="text-[10px] text-fg-muted mt-1 uppercase tracking-wide">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* User chip */}
            <div className="flex items-center gap-2 pl-2 pr-1 h-9 rounded-lg border border-border bg-surface">
              <div className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-sm font-medium text-fg hidden sm:inline">{user?.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageShell({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-fg tracking-tight">{title}</h1>
          {subtitle && <p className="text-fg-muted mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
