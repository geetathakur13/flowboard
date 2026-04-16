import { useState } from 'react';
import clsx from 'clsx';
import { User as UserIcon, Palette, Bell, Monitor, Moon, Sun } from 'lucide-react';
import { PageShell } from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';

type Tab = 'profile' | 'appearance' | 'notifications';

const TABS: { id: Tab; label: string; icon: typeof UserIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <PageShell title="Settings" subtitle="Manage your account, preferences, and notifications.">
      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <div className="flex lg:flex-col gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium lg:w-full text-left',
                tab === t.id
                  ? 'bg-brand text-white'
                  : 'text-fg-muted hover:bg-surface-alt hover:text-fg'
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
          {tab === 'profile' && (
            <>
              <h2 className="font-display font-bold text-lg text-fg">Profile</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand text-white text-2xl font-bold flex items-center justify-center">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-display font-semibold text-fg text-lg">{user?.name}</div>
                  <div className="text-sm text-fg-muted">{user?.email}</div>
                  <div className="text-xs text-fg-muted mt-1">
                    {user?.emailVerified ? '✓ Email verified' : '! Unverified'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-fg-muted pt-4 border-t border-border">
                Profile editing (name, avatar, password change) is a Module 4 task — this page is a working stub.
              </p>
            </>
          )}

          {tab === 'appearance' && (
            <>
              <h2 className="font-display font-bold text-lg text-fg">Appearance</h2>
              <div className="space-y-2">
                <p className="text-sm font-medium text-fg">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light' as const, label: 'Light', icon: Sun },
                    { id: 'dark' as const, label: 'Dark', icon: Moon },
                    { id: 'system' as const, label: 'System', icon: Monitor },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (opt.id === 'system') {
                          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                          setTheme(prefersDark ? 'dark' : 'light');
                        } else {
                          setTheme(opt.id);
                        }
                      }}
                      className={clsx(
                        'p-4 rounded-xl border text-sm font-medium flex flex-col items-center gap-2',
                        theme === opt.id ? 'border-brand bg-brand-50 dark:bg-brand-900/20 text-brand' : 'border-border text-fg-muted hover:border-brand/50'
                      )}
                    >
                      <opt.icon className="w-5 h-5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <h2 className="font-display font-bold text-lg text-fg">Notifications</h2>
              <p className="text-sm text-fg-muted">
                Real-time notifications are delivered via Socket.io to your personal user room. Toggles below are placeholders — wire them to a user-preferences document in Module 4.
              </p>
              {['Task assigned', 'Comment on my task', 'Mentions', 'Workspace updates'].map((label) => (
                <label key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-fg">{label}</span>
                  <input type="checkbox" defaultChecked className="w-10 h-6 appearance-none rounded-full bg-border checked:bg-brand relative transition-colors before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4 cursor-pointer" />
                </label>
              ))}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
