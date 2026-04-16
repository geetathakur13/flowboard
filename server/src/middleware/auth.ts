import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User, IUserDoc } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUserDoc;
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing Authorization header');
    }
    const token = header.slice('Bearer '.length).trim();
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('User not found');

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

// Optional: allow anonymous but attach user if token present
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.slice(7).trim());
    const user = await User.findById(payload.sub);
    if (user) {
      req.user = user;
      req.userId = user._id.toString();
    }
  } catch {
    // ignore
  }
  next();
}
