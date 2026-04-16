// Shared types used by both client and server
// These mirror the Mongoose schemas but are framework-agnostic

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'comment_added'
  | 'mention'
  | 'invite'
  | 'workspace_update';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspaceMember {
  user: string | IUser;
  role: UserRole;
  joinedAt: string;
}

export interface IWorkspace {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  owner: string | IUser;
  members: IWorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface IColumn {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface IProject {
  _id: string;
  name: string;
  key: string; // e.g. "FLOW"
  description?: string;
  workspace: string;
  columns: IColumn[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISubtask {
  _id?: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  project: string;
  columnId: string;
  order: number;
  priority: TaskPriority;
  labels: string[];
  assignee?: string | IUser;
  reporter: string | IUser;
  dueDate?: string;
  subtasks: ISubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  task: string;
  author: string | IUser;
  body: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Auth payloads
export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
}

// Constants
export const DEFAULT_COLUMNS: Omit<IColumn, 'id'>[] = [
  { name: 'Backlog', order: 0, color: '#64748b' },
  { name: 'Todo', order: 1, color: '#6366f1' },
  { name: 'In Progress', order: 2, color: '#f59e0b' },
  { name: 'Review', order: 3, color: '#8b5cf6' },
  { name: 'Done', order: 4, color: '#10b981' },
];

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};
