import { z } from 'zod';

const email = z.string().email('Invalid email').toLowerCase().trim();
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');

export const signupSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1, 'Name required').max(80),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password required'),
});

export const verifyEmailSchema = z.object({
  email,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({ email });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
