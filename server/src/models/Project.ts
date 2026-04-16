import { Schema, model, Document, Types } from 'mongoose';

export interface IColumn {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface IProjectDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  workspace: Types.ObjectId;
  columns: IColumn[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<IColumn>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    color: String,
  },
  { _id: false }
);

const projectSchema = new Schema<IProjectDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    key: { type: String, required: true, uppercase: true, maxlength: 8 },
    description: String,
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    columns: { type: [columnSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

projectSchema.index({ workspace: 1, key: 1 }, { unique: true });

export const Project = model<IProjectDoc>('Project', projectSchema);
