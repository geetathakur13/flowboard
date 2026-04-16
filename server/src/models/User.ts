import { Schema, model, Document, Types } from 'mongoose';

export interface IUserDoc extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  emailOtp?: string;
  emailOtpExpires?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;
  refreshTokenHash?: string; // single active refresh token per user (simple model)
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    avatarUrl: String,
    emailVerified: { type: Boolean, default: false },
    emailOtp: String,
    emailOtpExpires: Date,
    resetToken: String,
    resetTokenExpires: Date,
    refreshTokenHash: String,
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.emailOtp;
  delete obj.emailOtpExpires;
  delete obj.resetToken;
  delete obj.resetTokenExpires;
  delete obj.refreshTokenHash;
  delete obj.__v;
  return obj;
};

export const User = model<IUserDoc>('User', userSchema);
