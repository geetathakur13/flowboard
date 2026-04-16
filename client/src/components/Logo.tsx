import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#logoG)" />
        <rect x="7" y="8" width="5" height="16" rx="1.5" fill="white" opacity="0.95" />
        <rect x="14" y="8" width="5" height="10" rx="1.5" fill="white" opacity="0.75" />
        <rect x="21" y="8" width="4" height="7" rx="1.5" fill="white" opacity="0.55" />
      </svg>
      <span className="font-display font-extrabold text-[19px] tracking-tight text-fg">FlowBoard</span>
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-fg hover:bg-surface-alt transition-colors"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
