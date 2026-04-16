import { Schema, model, Document, Types } from 'mongoose';
import type { NotificationType } from '@flowboard/shared';

export interface INotificationDoc extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDoc>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['task_assigned', 'task_updated', 'comment_added', 'mention', 'invite', 'workspace_update'],
      required: true,
    },
    title: { type: String, required: true },
    body: String,
    link: String,
    read: { type: Boolean, default: false, index: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = model<INotificationDoc>('Notification', notificationSchema);
