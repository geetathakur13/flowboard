import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Workspace } from '../models/Workspace';
import { ApiError } from '../utils/ApiError';

const router = Router();

async function loadTask(taskId: string, userId: string) {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  const project = await Project.findById(task.project);
  if (!project) throw ApiError.notFound('Project not found');
  const workspace = await Workspace.findById(project.workspace);
  if (!workspace) throw ApiError.notFound('Workspace not found');
  const member = workspace.members.find((m) => m.user.toString() === userId);
  if (!member) throw ApiError.forbidden();
  return { task, project, workspace, member };
}

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { task } = await loadTask(req.params.id, req.userId!);
    await task.populate('assignee', 'name email avatarUrl');
    await task.populate('reporter', 'name email avatarUrl');
    res.json({ task });
  })
);

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  labels: z.array(z.string()).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  subtasks: z
    .array(
      z.object({
        title: z.string(),
        completed: z.boolean(),
        estimatedMinutes: z.number().optional(),
      })
    )
    .optional(),
});

router.patch(
  '/:id',
  requireAuth,
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { task } = await loadTask(req.params.id, req.userId!);
    Object.assign(task, req.body);
    await task.save();
    res.json({ task });
  })
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { task } = await loadTask(req.params.id, req.userId!);
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  })
);

// Move a task to a column / reorder
const moveSchema = z.object({
  columnId: z.string(),
  order: z.number().int().min(0),
});

router.post(
  '/:id/move',
  requireAuth,
  validate(moveSchema),
  asyncHandler(async (req, res) => {
    const { task } = await loadTask(req.params.id, req.userId!);
    const { columnId, order } = req.body as z.infer<typeof moveSchema>;
    task.columnId = columnId;
    task.order = order;
    await task.save();
    res.json({ task });
  })
);

export default router;
