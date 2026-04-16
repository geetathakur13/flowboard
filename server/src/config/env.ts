import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    // eslint-disable-next-line no-console
    console.error(`❌ Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '5000'), 10),

  mongoUri: required('MONGODB_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  anthropicApiKey: optional('ANTHROPIC_API_KEY'),

  smtp: {
    host: optional('SMTP_HOST'),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    from: optional('EMAIL_FROM', 'FlowBoard <no-reply@flowboard.app>'),
  },

  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),
  allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  cookie: {
    domain: optional('COOKIE_DOMAIN') || undefined,
    secure: optional('COOKIE_SECURE', 'false') === 'true',
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
export const isDevelopment = env.nodeEnv === 'development';
