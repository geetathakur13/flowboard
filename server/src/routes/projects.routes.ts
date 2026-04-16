import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Workspace } from '../models/Workspace';
import { ApiError } from '../utils/ApiError';

const router = Router();

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');
  const workspace = await Workspace.findById(project.workspace);
  if (!workspace) throw ApiError.notFound('Workspace not found');
  const member = workspace.members.find((m) => m.user.toString() === userId);
  if (!member) throw ApiError.forbidden('Not a member of this workspace');
  return { project, workspace, member };
}

// GET /api/projects/:id — project details
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { project } = await assertProjectAccess(req.params.id, req.userId!);
    res.json({ project });
  })
);

// GET /api/projects/:id/board — tasks grouped by column
router.get(
  '/:id/board',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { project } = await assertProjectAccess(req.params.id, req.userId!);
    const tasks = await Task.find({ project: project._id })
      .populate('assignee', 'name email avatarUrl')
      .populate('reporter', 'name email avatarUrl')
      .sort('order');

    const board = project.columns
      .sort((a, b) => a.order - b.order)
      .map((col) => ({
        column: col,
        tasks: tasks.filter((t) => t.columnId === col.id),
      }));
    res.json({ project, board });
  })
);

// POST /api/projects/:id/tasks — create task (stub)
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().optional(),
  columnId: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  labels: z.array(z.string()).default([]),
  assignee: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

router.post(
  '/:id/tasks',
  requireAuth,
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    const { project } = await assertProjectAccess(req.params.id, req.userId!);
    const body = req.body as z.infer<typeof createTaskSchema>;

    const count = await Task.countDocuments({ project: project._id, columnId: body.columnId });
    const task = await Task.create({
      ...body,
      project: project._id,
      reporter: req.userId,
      order: count,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
    res.status(201).json({ task });
  })
);

export default router;
