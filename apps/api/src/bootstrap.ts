import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
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
  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');
}
