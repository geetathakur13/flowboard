import { Schema, model, Document, Types } from 'mongoose';

export interface ICommentDoc extends Document {
  _id: Types.ObjectId;
  task: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  mentions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<ICommentDoc>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 4000 },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Comment = model<ICommentDoc>('Comment', commentSchema);
