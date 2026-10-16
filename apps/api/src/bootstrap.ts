import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import { join } from 'node:path';
import helmet from 'helmet';
import { env } from './config/env';

/** Shared HTTP setup for main.ts and integration tests. */
export function configureApp(app: INestApplication): void {
  const origins = env().APP_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['authorization', 'content-type', 'x-client', 'x-requested-with', 'x-request-id', 'accept-language', 'idempotency-key'],
  });
  // Minimal admin web client (§15), served as static files; all data access goes through /admin/v1.
  app.use('/admin', express.static(join(__dirname, '..', 'public', 'admin'), { index: 'index.html', maxAge: '5m' }));
  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');
}
