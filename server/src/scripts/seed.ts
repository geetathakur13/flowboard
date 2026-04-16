import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Notification } from '../models/Notification';
import { hashPassword } from '../utils/password';
import { DEFAULT_COLUMNS } from '@flowboard/shared';
import crypto from 'crypto';

/*
  Seeds the database with sample data:
  - 3 users (all verified, password "password123")
  - 1 workspace with all 3 users as members
  - 2 projects with default columns
  - ~10 sample tasks across columns
  - 2 notifications for the primary user
*/

const DEMO_PASSWORD = 'password123';

async function run(): Promise<void> {
  await connectDatabase();

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('👤 Creating users...');
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [alice, bob, carol] = await User.create([
    {
      email: 'alice@flowboard.dev',
      name: 'Alice Chen',
      passwordHash,
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Alice',
    },
    {
      email: 'bob@flowboard.dev',
      name: 'Bob Martinez',
      passwordHash,
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Bob',
    },
    {
      email: 'carol@flowboard.dev',
      name: 'Carol Singh',
      passwordHash,
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Carol',
    },
  ]);

  console.log('🏢 Creating workspace...');
  const workspace = await Workspace.create({
    name: 'Acme Engineering',
    slug: 'acme-engineering-' + crypto.randomBytes(3).toString('hex'),
    description: 'Sample workspace seeded for local development',
    owner: alice._id,
    members: [
      { user: alice._id, role: 'owner', joinedAt: new Date() },
      { user: bob._id, role: 'admin', joinedAt: new Date() },
      { user: carol._id, role: 'member', joinedAt: new Date() },
    ],
  });

  console.log('📁 Creating projects...');
  const mkCols = () => DEFAULT_COLUMNS.map((c, i) => ({ ...c, id: `col_${Date.now()}_${i}_${crypto.randomBytes(2).toString('hex')}` }));

  const webApp = await Project.create({
    name: 'Web Application',
    key: 'WEB',
    description: 'Main customer-facing React app',
    workspace: workspace._id,
    columns: mkCols(),
    createdBy: alice._id,
  });

  const mobileApp = await Project.create({
    name: 'Mobile App',
    key: 'MOB',
    description: 'iOS + Android React Native app',
    workspace: workspace._id,
    columns: mkCols(),
    createdBy: alice._id,
  });

  console.log('✅ Creating tasks...');
  const [backlog, todo, inProgress, review, done] = webApp.columns;

  const tasks = [
    { col: backlog.id, title: 'Redesign marketing landing page', priority: 'medium' as const, assignee: carol._id },
    { col: backlog.id, title: 'Add dark mode toggle to dashboard', priority: 'low' as const },
    { col: todo.id, title: 'Implement OAuth (Google + GitHub)', priority: 'high' as const, assignee: bob._id },
    { col: todo.id, title: 'Write onboarding email sequence', priority: 'medium' as const, assignee: alice._id },
    { col: inProgress.id, title: 'Build Kanban drag-and-drop with dnd-kit', priority: 'high' as const, assignee: alice._id },
    { col: inProgress.id, title: 'Integrate Anthropic Claude API', priority: 'urgent' as const, assignee: bob._id },
    { col: review.id, title: 'JWT refresh token flow', priority: 'high' as const, assignee: carol._id },
    { col: done.id, title: 'Project scaffolding with Vite + Express', priority: 'medium' as const, assignee: alice._id },
    { col: done.id, title: 'Set up MongoDB schemas', priority: 'medium' as const, assignee: bob._id },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    await Task.create({
      title: t.title,
      project: webApp._id,
      columnId: t.col,
      order: i,
      priority: t.priority,
      assignee: t.assignee,
      reporter: alice._id,
      labels: ['seed'],
      subtasks: [],
    });
  }

  // A couple of tasks in the mobile project
  const mobileTodo = mobileApp.columns.find((c) => c.name === 'Todo')!;
  await Task.create({
    title: 'Set up React Native project',
    project: mobileApp._id,
    columnId: mobileTodo.id,
    order: 0,
    priority: 'high',
    reporter: alice._id,
    assignee: bob._id,
    labels: [],
    subtasks: [],
  });

  console.log('🔔 Creating notifications...');
  await Notification.create([
    {
      recipient: alice._id,
      type: 'mention',
      title: 'Bob mentioned you on "Integrate Anthropic Claude API"',
      body: '@alice can you review the streaming implementation?',
      link: `/projects/${webApp._id}`,
      read: false,
    },
    {
      recipient: alice._id,
      type: 'task_assigned',
      title: 'You were assigned "Build Kanban drag-and-drop with dnd-kit"',
      link: `/projects/${webApp._id}`,
      read: false,
    },
  ]);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Seed complete! Test login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📧 alice@flowboard.dev  /  ${DEMO_PASSWORD}  (owner)`);
  console.log(`  📧 bob@flowboard.dev    /  ${DEMO_PASSWORD}  (admin)`);
  console.log(`  📧 carol@flowboard.dev  /  ${DEMO_PASSWORD}  (member)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
