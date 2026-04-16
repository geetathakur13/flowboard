import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  type: 'access' | 'refresh';
}

export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    if (decoded.type !== 'access') throw new Error('Wrong token type');
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
    if (decoded.type !== 'refresh') throw new Error('Wrong token type');
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}
