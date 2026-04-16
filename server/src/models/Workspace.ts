import { Schema, model, Document, Types } from 'mongoose';
import type { UserRole } from '@flowboard/shared';

export interface IWorkspaceMember {
  user: Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
}

export interface IWorkspaceDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  owner: Types.ObjectId;
  members: IWorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IWorkspaceMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new Schema<IWorkspaceDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: String,
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

export const Workspace = model<IWorkspaceDoc>('Workspace', workspaceSchema);
