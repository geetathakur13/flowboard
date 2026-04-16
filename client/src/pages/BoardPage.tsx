import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Plus } from 'lucide-react';
import { PageShell } from '@/components/DashboardLayout';
import { Button } from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';
import type { IProject, ITask, IWorkspace, TaskPriority } from '@flowboard/shared';
import { PRIORITY_COLORS } from '@flowboard/shared';
import toast from 'react-hot-toast';

interface BoardColumn {
  column: { id: string; name: string; order: number; color?: string };
  tasks: ITask[];
}

export default function BoardPage() {
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [board, setBoard] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ workspaces: IWorkspace[] }>('/workspaces');
        setWorkspaces(data.workspaces);
        if (data.workspaces.length > 0) {
          const wsId = data.workspaces[0]._id;
          const { data: wsData } = await api.get<{ projects: IProject[] }>(`/workspaces/${wsId}/projects`);
          setProjects(wsData.projects);
          if (wsData.projects.length > 0) setSelectedProject(wsData.projects[0]._id);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    api
      .get<{ board: BoardColumn[] }>(`/projects/${selectedProject}/board`)
      .then((r) => setBoard(r.data.board))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [selectedProject]);

  return (
    <PageShell
      title="Board"
      subtitle="Your Kanban in motion. Drag-and-drop coming in Module 2."
      actions={
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-11 px-4 rounded-xl border border-border bg-surface text-fg text-sm font-medium"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.key})</option>
              ))}
            </select>
          )}
          <Button icon={<Plus className="w-4 h-4" />}>New task</Button>
        </div>
      }
    >
      {loading ? (
        <div className="text-fg-muted text-sm">Loading board…</div>
      ) : workspaces.length === 0 ? (
        <EmptyState
          title="No workspaces"
          description="Go back to the Dashboard and create a workspace first."
        />
      ) : board.length === 0 ? (
        <EmptyState
          title="No board yet"
          description="Run `npm run seed` to populate sample projects, or create a project via the API."
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4">
          {board.map((col, i) => (
            <motion.div
              key={col.column.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="w-80 shrink-0"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col.column.color ?? '#94a3b8' }}
                  />
                  <h3 className="font-display font-semibold text-fg text-sm uppercase tracking-wider">
                    {col.column.name}
                  </h3>
                  <span className="text-xs text-fg-muted">{col.tasks.length}</span>
                </div>
                <button className="text-fg-muted hover:text-fg">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 min-h-[200px] p-2 rounded-2xl bg-surface-alt/60">
                {col.tasks.length === 0 ? (
                  <p className="text-xs text-fg-muted p-3 text-center">Drop tasks here</p>
                ) : (
                  col.tasks.map((t) => <TaskCard key={t._id} task={t} />)
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function TaskCard({ task }: { task: ITask }) {
  const priority = task.priority as TaskPriority;
  return (
    <div className="p-3 rounded-xl bg-surface border border-border hover:border-brand/40 hover:shadow-card transition-all cursor-pointer">
      <p className="text-sm font-medium text-fg leading-snug">{task.title}</p>
      <div className="flex items-center justify-between mt-3">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white"
          style={{ backgroundColor: PRIORITY_COLORS[priority] }}
        >
          {priority}
        </span>
        {task.assignee && typeof task.assignee === 'object' && (
          <div className="w-6 h-6 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center" title={task.assignee.name}>
            {task.assignee.name[0]}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-10 rounded-2xl border border-dashed border-border text-center">
      <p className="font-display font-semibold text-fg mb-1">{title}</p>
      <p className="text-sm text-fg-muted">{description}</p>
    </div>
  );
}
