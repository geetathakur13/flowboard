import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Logo, ThemeToggle } from '@/components/Logo';
import { Sparkles, Zap, Layers } from 'lucide-react';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] relative">
      {/* LEFT — form */}
      <div className="relative flex flex-col px-6 sm:px-10 lg:px-16 py-8">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
        >
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg">{title}</h1>
            {subtitle && <p className="text-fg-muted mt-2 text-[15px]">{subtitle}</p>}
          </div>
          {children}
        </motion.div>

        <p className="text-xs text-fg-muted text-center lg:text-left">
          © {new Date().getFullYear()} FlowBoard. Built for teams who ship.
        </p>
      </div>

      {/* RIGHT — visual panel */}
      <div className="hidden lg:flex relative items-center justify-center bg-brand-radial bg-surface-alt overflow-hidden">
        <div className="auth-blob" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-lg p-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-fg">AI-powered project management</span>
          </div>
          <h2 className="font-display font-extrabold text-4xl leading-tight text-fg mb-4">
            Where great teams <span className="text-brand">plan, ship, and reflect</span>.
          </h2>
          <p className="text-fg-muted mb-10 leading-relaxed">
            Break tasks down with AI. Auto-generate sprint summaries. Ship daily standups without writing them.
          </p>

          <div className="space-y-4">
            {[
              { icon: Zap, title: '5 built-in AI tools', desc: 'Breakdowns, summaries, standups, and more.' },
              { icon: Layers, title: 'Drag-and-drop Kanban', desc: 'Customizable columns, priorities, and labels.' },
              { icon: Sparkles, title: 'Real-time collaboration', desc: 'Live comments, mentions, and notifications.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex gap-3 p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10"
              >
                <div className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-semibold text-fg text-[15px]">{f.title}</div>
                  <div className="text-sm text-fg-muted">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
