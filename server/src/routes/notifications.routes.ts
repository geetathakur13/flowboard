import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { Notification } from '../models/Notification';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort('-createdAt')
      .limit(50);
    res.json({ notifications });
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({ recipient: req.userId, read: false });
    res.json({ count });
  })
);

router.post(
  '/:id/mark-read',
  asyncHandler(async (req, res) => {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { read: true }
    );
    res.json({ message: 'Marked read' });
  })
);

router.post(
  '/mark-all-read',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
    res.json({ message: 'All marked read' });
  })
);

export default router;
