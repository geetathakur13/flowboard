import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

// ----- Button -----

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...rest }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60 disabled:cursor-not-allowed';
    const variants = {
      primary:
        'bg-brand text-white hover:bg-brand-600 active:bg-brand-700 shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)]',
      secondary:
        'bg-surface text-fg border border-border hover:bg-surface-alt',
      ghost: 'text-fg hover:bg-surface-alt',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    };
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-5 text-[15px]',
      lg: 'h-12 px-6 text-base',
    };
    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ----- Input -----

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leading, trailing, className, id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <label htmlFor={inputId} className="block">
        {label && (
          <span className="block text-sm font-medium text-fg mb-1.5">{label}</span>
        )}
        <span
          className={clsx(
            'flex items-center gap-2 px-3.5 h-11 rounded-xl border bg-surface transition-colors',
            'border-border focus-within:border-brand focus-within:shadow-glow',
            error && 'border-red-500/60 focus-within:border-red-500'
          )}
        >
          {leading && <span className="text-fg-muted shrink-0">{leading}</span>}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'flex-1 bg-transparent outline-none text-fg placeholder:text-fg-muted text-[15px]',
              className
            )}
            {...rest}
          />
          {trailing && <span className="text-fg-muted shrink-0">{trailing}</span>}
        </span>
        {error ? (
          <span className="block text-xs text-red-500 mt-1.5">{error}</span>
        ) : hint ? (
          <span className="block text-xs text-fg-muted mt-1.5">{hint}</span>
        ) : null}
      </label>
    );
  }
);
Input.displayName = 'Input';
