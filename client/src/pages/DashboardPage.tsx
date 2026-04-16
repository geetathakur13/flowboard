import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { PageShell } from '@/components/DashboardLayout';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { IWorkspace } from '@flowboard/shared';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ workspaces: IWorkspace[] }>('/workspaces')
      .then((r) => setWorkspaces(r.data.workspaces))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function createWorkspace() {
    const name = window.prompt('Workspace name?');
    if (!name) return;
    try {
      const { data } = await api.post<{ workspace: IWorkspace }>('/workspaces', { name });
      setWorkspaces((w) => [data.workspace, ...w]);
      toast.success('Workspace created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const stats = [
    { label: 'Workspaces', value: workspaces.length, icon: FolderKanban, tint: 'bg-brand-50 dark:bg-brand-900/20 text-brand' },
    { label: 'Team members', value: workspaces.reduce((a, w) => a + w.members.length, 0), icon: Users, tint: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
    { label: 'AI calls this week', value: '—', icon: Sparkles, tint: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  ];

  return (
    <PageShell
      title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
      subtitle="Here's what's happening across your FlowBoard."
      actions={
        <Button onClick={createWorkspace} icon={<Plus className="w-4 h-4" />}>
          New workspace
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="p-5 rounded-2xl bg-surface border border-border"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.tint} mb-4`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-display font-extrabold text-fg">{s.value}</div>
            <div className="text-sm text-fg-muted mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-fg">Your workspaces</h2>
      </div>

      {loading ? (
        <div className="text-fg-muted text-sm">Loading…</div>
      ) : workspaces.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border text-center">
          <p className="font-display font-semibold text-fg mb-1">No workspaces yet</p>
          <p className="text-sm text-fg-muted mb-4">Create one to start organizing projects.</p>
          <Button onClick={createWorkspace} icon={<Plus className="w-4 h-4" />}>Create workspace</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((w) => (
            <Link
              key={w._id}
              to={`/board?workspace=${w._id}`}
              className="group p-5 rounded-2xl bg-surface border border-border hover:border-brand/50 hover:shadow-card transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white font-bold">
                  {w.name[0].toUpperCase()}
                </div>
                <ArrowRight className="w-4 h-4 text-fg-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-display font-semibold text-fg">{w.name}</div>
              <div className="text-xs text-fg-muted mt-1">{w.members.length} member{w.members.length !== 1 ? 's' : ''}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-brand to-violet-600 text-white">
        <div className="flex items-start gap-4">
          <Sparkles className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg">Module stubs ready</h3>
            <p className="text-white/80 text-sm mt-1">
              Auth is fully wired. Kanban, AI Tools, and Notifications have working scaffolding — open them from the sidebar to extend.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
