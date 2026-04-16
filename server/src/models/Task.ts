import { Schema, model, Document, Types } from 'mongoose';
import type { TaskPriority } from '@flowboard/shared';

export interface ISubtask {
  _id?: Types.ObjectId;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface ITaskDoc extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  project: Types.ObjectId;
  columnId: string;
  order: number;
  priority: TaskPriority;
  labels: string[];
  assignee?: Types.ObjectId;
  reporter: Types.ObjectId;
  dueDate?: Date;
  subtasks: ISubtask[];
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  estimatedMinutes: Number,
});

const taskSchema = new Schema<ITaskDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: String,
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    columnId: { type: String, required: true, index: true },
    order: { type: Number, required: true, default: 0 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    labels: { type: [String], default: [] },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: Date,
    subtasks: { type: [subtaskSchema], default: [] },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, columnId: 1, order: 1 });

export const Task = model<ITaskDoc>('Task', taskSchema);
