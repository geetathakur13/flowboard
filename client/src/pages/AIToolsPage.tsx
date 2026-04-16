import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ListTree, FileText, BarChart3, Flag, ClipboardList } from 'lucide-react';
import clsx from 'clsx';
import { PageShell } from '@/components/DashboardLayout';
import { Button, Input } from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

type Tool = 'breakdown' | 'description' | 'summary' | 'priority' | 'standup';

const TOOLS: { id: Tool; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: 'breakdown',   label: 'Task breakdown',   icon: ListTree,      hint: 'Turn a big task into 4-7 actionable subtasks with time estimates.' },
  { id: 'description', label: 'Smart description', icon: FileText,     hint: 'Generate a rich task description and acceptance criteria from a title.' },
  { id: 'summary',     label: 'Sprint summary',   icon: BarChart3,     hint: 'Produce a weekly sprint summary from a list of tasks.' },
  { id: 'priority',    label: 'Priority suggestion', icon: Flag,       hint: 'Let AI suggest a priority based on title, description, and due date.' },
  { id: 'standup',     label: 'Standup generator', icon: ClipboardList, hint: 'Generate a daily standup from your in-progress tasks.' },
];

export default function AIToolsPage() {
  const [tool, setTool] = useState<Tool>('breakdown');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!input.trim()) {
      toast.error('Enter something first');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      if (tool === 'breakdown') {
        const { data } = await api.post('/ai/task-breakdown', { title: input });
        setResult(data);
      } else if (tool === 'description') {
        const { data } = await api.post('/ai/smart-description', { title: input });
        setResult(data);
      } else if (tool === 'summary') {
        const tasks = input.split('\n').filter(Boolean).map((line) => {
          const [status, ...rest] = line.split(':');
          return { status: status.trim() || 'Todo', title: rest.join(':').trim() || line };
        });
        const { data } = await api.post('/ai/sprint-summary', { tasks });
        setResult(data);
      } else if (tool === 'priority') {
        const { data } = await api.post('/ai/priority-suggestion', { title: input });
        setResult(data);
      } else {
        const tasks = input.split('\n').filter(Boolean).map((line) => ({ title: line, status: 'In Progress' }));
        const { data } = await api.post('/ai/standup', { tasks });
        setResult(data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const activeTool = TOOLS.find((t) => t.id === tool)!;

  return (
    <PageShell
      title="AI Tools"
      subtitle="Five built-in tools powered by Claude. Add ANTHROPIC_API_KEY in .env to enable real output."
    >
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Tabs */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTool(t.id); setResult(null); setInput(''); }}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 lg:w-full text-left',
                tool === t.id
                  ? 'bg-brand text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)]'
                  : 'bg-surface border border-border text-fg-muted hover:bg-surface-alt hover:text-fg'
              )}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap lg:whitespace-normal">{t.label}</span>
            </button>
          ))}
        </div>

        <motion.div
          key={tool}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-violet-500 text-white flex items-center justify-center">
                <activeTool.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-fg">{activeTool.label}</h2>
                <p className="text-sm text-fg-muted mt-0.5">{activeTool.hint}</p>
              </div>
            </div>

            {tool === 'summary' || tool === 'standup' ? (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  tool === 'summary'
                    ? 'One task per line, e.g.\nDone: Ship login flow\nIn Progress: Build Kanban\nTodo: Add OAuth'
                    : 'One task per line describing what you worked on today'
                }
                rows={6}
                className="w-full p-3 rounded-xl border border-border bg-bg text-fg placeholder:text-fg-muted font-mono text-sm outline-none focus:border-brand focus:shadow-glow"
              />
            ) : (
              <Input
                name="ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  tool === 'breakdown' ? 'e.g. Implement user authentication with OAuth'
                  : tool === 'description' ? 'e.g. Add dark mode toggle'
                  : 'e.g. Fix critical security bug before launch tomorrow'
                }
              />
            )}

            <div className="mt-4">
              <Button onClick={run} loading={loading} icon={<Sparkles className="w-4 h-4" />}>
                Generate with AI
              </Button>
            </div>
          </div>

          {result !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-surface border border-border"
            >
              <h3 className="font-display font-semibold text-fg mb-3">Result</h3>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-bg p-4 rounded-xl border border-border overflow-auto max-h-[500px]">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}
