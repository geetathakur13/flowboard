import type { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOtp, sendEmail, otpEmailHtml, resetEmailHtml } from '../utils/email';
import { ApiError } from '../utils/ApiError';
import { env, isProduction } from '../config/env';
import type { SignupInput, LoginInput } from './auth.schemas';

const REFRESH_COOKIE = 'fb_refresh';
const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookie.secure || isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'lax' | 'none',
    domain: env.cookie.domain,
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

async function issueTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = signRefreshToken({ sub: userId, email });
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(userId, { refreshTokenHash });
  return { accessToken, refreshToken };
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as SignupInput;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');

  const passwordHash = await hashPassword(password);
  const otp = generateOtp(6);

  const user = await User.create({
    email,
    name,
    passwordHash,
    emailOtp: otp,
    emailOtpExpires: new Date(Date.now() + OTP_TTL_MS),
    emailVerified: false,
  });

  await sendEmail({
    to: user.email,
    subject: 'Verify your FlowBoard account',
    html: otpEmailHtml(user.name, otp),
    text: `Your FlowBoard verification code is: ${otp}`,
  });

  res.status(201).json({
    message: 'Account created. Check your email for a verification code.',
    user: user.toJSON(),
  });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { email, otp } = req.body as { email: string; otp: string };
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('User not found');
  if (user.emailVerified) {
    res.json({ message: 'Already verified' });
    return;
  }
  if (!user.emailOtp || !user.emailOtpExpires || user.emailOtpExpires < new Date()) {
    throw ApiError.badRequest('OTP expired. Request a new one.');
  }
  if (user.emailOtp !== otp) throw ApiError.badRequest('Incorrect OTP');

  user.emailVerified = true;
  user.emailOtp = undefined;
  user.emailOtpExpires = undefined;
  await user.save();

  const tokens = await issueTokens(user._id.toString(), user.email);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
  res.json({ user: user.toJSON(), accessToken: tokens.accessToken });
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('User not found');
  if (user.emailVerified) {
    res.json({ message: 'Already verified' });
    return;
  }
  const otp = generateOtp(6);
  user.emailOtp = otp;
  user.emailOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  await user.save();
  await sendEmail({
    to: user.email,
    subject: 'Your new FlowBoard verification code',
    html: otpEmailHtml(user.name, otp),
    text: `Your new code: ${otp}`,
  });
  res.json({ message: 'OTP resent' });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;
  const user = await User.findOne({ email });
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  if (!user.emailVerified) {
    throw ApiError.forbidden('Email not verified. Check your inbox for a code.');
  }

  const tokens = await issueTokens(user._id.toString(), user.email);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
  res.json({ user: user.toJSON(), accessToken: tokens.accessToken });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub);
  if (!user || !user.refreshTokenHash) throw ApiError.unauthorized('Session invalid');

  const matches = await bcrypt.compare(token, user.refreshTokenHash);
  if (!matches) throw ApiError.unauthorized('Session invalid');

  const tokens = await issueTokens(user._id.toString(), user.email);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
  res.json({ accessToken: tokens.accessToken, user: user.toJSON() });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 } });
    } catch {
      // ignore
    }
  }
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: 0 });
  res.json({ message: 'Logged out' });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email });
  // Always respond OK to avoid email enumeration
  if (user) {
    const raw = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(raw).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();
    const link = `${env.clientUrl}/reset-password?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your FlowBoard password',
      html: resetEmailHtml(user.name, link),
      text: `Reset your password: ${link}`,
    });
  }
  res.json({ message: 'If that email exists, a reset link was sent.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string };
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpires: { $gt: new Date() },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.passwordHash = await hashPassword(password);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  user.refreshTokenHash = undefined; // invalidate existing sessions
  await user.save();
  res.json({ message: 'Password updated. Please log in.' });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  res.json({ user: req.user.toJSON() });
}
