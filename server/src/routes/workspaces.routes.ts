import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Workspace } from '../models/Workspace';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { DEFAULT_COLUMNS } from '@flowboard/shared';
import crypto from 'crypto';

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(500).optional(),
});

// List workspaces the user belongs to
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.userId }, { 'members.user': req.userId }],
    })
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl')
      .sort('-createdAt');
    res.json({ workspaces });
  })
);

// Create workspace — user becomes owner
router.post(
  '/',
  requireAuth,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body as z.infer<typeof createSchema>;
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) +
      '-' +
      crypto.randomBytes(3).toString('hex');

    const workspace = await Workspace.create({
      name,
      slug,
      description,
      owner: req.userId,
      members: [{ user: req.userId, role: 'owner', joinedAt: new Date() }],
    });
    res.status(201).json({ workspace });
  })
);

// Get one workspace (with projects)
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl');
    if (!workspace) throw ApiError.notFound('Workspace not found');

    const isMember = workspace.members.some((m) => m.user._id.toString() === req.userId);
    if (!isMember) throw ApiError.forbidden('Not a member of this workspace');

    const projects = await Project.find({ workspace: workspace._id }).sort('-createdAt');
    res.json({ workspace, projects });
  })
);

// Invite a member by email
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

router.post(
  '/:id/invite',
  requireAuth,
  validate(inviteSchema),
  asyncHandler(async (req, res) => {
    const { email, role } = req.body as z.infer<typeof inviteSchema>;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) throw ApiError.notFound('Workspace not found');

    const inviter = workspace.members.find((m) => m.user.toString() === req.userId);
    if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
      throw ApiError.forbidden('Only owners and admins can invite');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw ApiError.notFound('User with that email not found. They must sign up first.');

    if (workspace.members.some((m) => m.user.toString() === user._id.toString())) {
      throw ApiError.conflict('User is already a member');
    }

    workspace.members.push({ user: user._id, role, joinedAt: new Date() });
    await workspace.save();
    res.json({ workspace });
  })
);

// Nested: list projects for workspace
router.get(
  '/:id/projects',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) throw ApiError.notFound('Workspace not found');
    const isMember = workspace.members.some((m) => m.user.toString() === req.userId);
    if (!isMember) throw ApiError.forbidden();
    const projects = await Project.find({ workspace: workspace._id }).sort('-createdAt');
    res.json({ projects });
  })
);

// Nested: create project
const projectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  key: z.string().trim().min(2).max(8).regex(/^[A-Z0-9]+$/, 'Key must be uppercase alphanumeric'),
  description: z.string().max(500).optional(),
});

router.post(
  '/:id/projects',
  requireAuth,
  validate(projectSchema),
  asyncHandler(async (req, res) => {
    const { name, key, description } = req.body as z.infer<typeof projectSchema>;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) throw ApiError.notFound('Workspace not found');

    const member = workspace.members.find((m) => m.user.toString() === req.userId);
    if (!member || member.role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot create projects');
    }

    const project = await Project.create({
      name,
      key,
      description,
      workspace: workspace._id,
      createdBy: req.userId,
      columns: DEFAULT_COLUMNS.map((c, i) => ({
        ...c,
        id: `col_${Date.now()}_${i}`,
      })),
    });
    res.status(201).json({ project });
  })
);

export default router;
