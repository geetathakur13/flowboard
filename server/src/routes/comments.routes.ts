import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Comment } from '../models/Comment';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { emitToUser } from '../sockets';
import { ApiError } from '../utils/ApiError';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const taskId = (req.params as { id: string }).id;
    const comments = await Comment.find({ task: taskId })
      .populate('author', 'name email avatarUrl')
      .sort('createdAt');
    res.json({ comments });
  })
);

const createSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const taskId = (req.params as { id: string }).id;
    const task = await Task.findById(taskId);
    if (!task) throw ApiError.notFound('Task not found');

    const { body } = req.body as z.infer<typeof createSchema>;

    // Parse @mentions — @name or @email
    const mentionMatches = Array.from(body.matchAll(/@([a-zA-Z0-9._-]+)/g)).map((m) => m[1]);
    const mentionedUsers = mentionMatches.length
      ? await User.find({
          $or: [
            { email: { $in: mentionMatches.map((m) => m.toLowerCase()) } },
            { name: { $in: mentionMatches } },
          ],
        })
      : [];

    const comment = await Comment.create({
      task: task._id,
      author: req.userId,
      body,
      mentions: mentionedUsers.map((u) => u._id),
    });
    await comment.populate('author', 'name email avatarUrl');

    // Notify mentioned users
    for (const mu of mentionedUsers) {
      if (mu._id.toString() === req.userId) continue;
      const notif = await Notification.create({
        recipient: mu._id,
        type: 'mention',
        title: `${req.user?.name} mentioned you on "${task.title}"`,
        body: body.slice(0, 200),
        link: `/tasks/${task._id}`,
      });
      emitToUser(mu._id.toString(), 'notification:new', notif);
    }

    res.status(201).json({ comment });
  })
);

export default router;
