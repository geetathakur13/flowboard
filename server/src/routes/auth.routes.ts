import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import * as ctrl from '../controllers/auth.controller';
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(ctrl.signup));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(ctrl.login));
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), asyncHandler(ctrl.verifyEmail));
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), asyncHandler(ctrl.resendOtp));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), asyncHandler(ctrl.forgotPassword));
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), asyncHandler(ctrl.resetPassword));
router.post('/refresh-token', asyncHandler(ctrl.refreshToken));
router.post('/logout', asyncHandler(ctrl.logout));
router.get('/me', requireAuth, asyncHandler(ctrl.me));

export default router;
