import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env, isDevelopment } from './config/env';
import { connectDatabase } from './config/database';
import { generalLimiter } from './middleware/rateLimit';
import { notFound, errorHandler } from './middleware/errorHandler';
import { initSockets } from './sockets';

import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspaces.routes';
import projectRoutes from './routes/projects.routes';
import taskRoutes from './routes/tasks.routes';
import commentRoutes from './routes/comments.routes';
import notificationRoutes from './routes/notifications.routes';
import aiRoutes from './routes/ai.routes';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app: Application = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // allow curl/Postman/healthchecks
        if (env.allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (isDevelopment) app.use(morgan('dev'));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', env: env.nodeEnv, time: new Date().toISOString() });
  });

  // Apply general limiter to all /api routes (auth-specific limiter is stricter)
  app.use('/api', generalLimiter);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/tasks/:id/comments', commentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const httpServer = http.createServer(app);
  initSockets(httpServer);

  httpServer.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 FlowBoard server ready on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`   CORS allowed: ${env.allowedOrigins.join(', ')}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
