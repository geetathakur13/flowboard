import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { aiLimiter } from '../middleware/rateLimit';
import * as ai from '../services/ai.service';

const router = Router();
router.use(requireAuth, aiLimiter);

router.post(
  '/task-breakdown',
  validate(z.object({ title: z.string().min(1), context: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const { title, context } = req.body as { title: string; context?: string };
    const subtasks = await ai.taskBreakdown(title, context);
    res.json({ subtasks, aiEnabled: ai.aiEnabled() });
  })
);

router.post(
  '/smart-description',
  validate(z.object({ title: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const result = await ai.smartDescription((req.body as { title: string }).title);
    res.json({ ...result, aiEnabled: ai.aiEnabled() });
  })
);

router.post(
  '/sprint-summary',
  validate(
    z.object({
      tasks: z.array(z.object({ title: z.string(), status: z.string() })),
    })
  ),
  asyncHandler(async (req, res) => {
    const summary = await ai.sprintSummary(req.body.tasks);
    res.json({ summary, aiEnabled: ai.aiEnabled() });
  })
);

router.post(
  '/priority-suggestion',
  validate(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const result = await ai.prioritySuggestion(req.body);
    res.json({ ...result, aiEnabled: ai.aiEnabled() });
  })
);

router.post(
  '/standup',
  validate(
    z.object({
      tasks: z.array(z.object({ title: z.string(), status: z.string() })),
    })
  ),
  asyncHandler(async (req, res) => {
    const standup = await ai.standupGenerator(req.body.tasks);
    res.json({ standup, aiEnabled: ai.aiEnabled() });
  })
);

export default router;
