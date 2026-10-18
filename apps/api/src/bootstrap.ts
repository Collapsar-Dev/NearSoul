import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import helmet from 'helmet';
import { env } from './config/env';

/** Shared HTTP setup for main.ts and integration tests. */
export function configureApp(app: INestApplication): void {
  const origins = env().APP_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'wasm-unsafe-eval'", 'https://www.gstatic.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          // blob:/data: — the web image picker reads the chosen photo through a blob: URL before upload.
          connectSrc: ["'self'", 'blob:', 'data:', 'wss:', 'https:', 'http://localhost:3000', 'ws://localhost:3000'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          workerSrc: ["'self'", 'blob:'],
          // 'self' so /mobile.html can show the app inside a phone frame; other sites still can't embed it.
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  // Personal API data must never sit in the browser's HTTP cache (shared devices), and identical concurrent GETs
  // must not wait on each other's cache entry. Signed media URLs and public map tiles stay cacheable.
  app.use('/v1', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith('/media/') && !req.path.startsWith('/tiles/')) res.setHeader('cache-control', 'no-store');
    next();
  });
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['authorization', 'content-type', 'x-client', 'x-requested-with', 'x-request-id', 'accept-language', 'idempotency-key'],
  });
  // Minimal admin web client (§15), served as static files; all data access goes through /admin/v1.
  app.use('/admin', express.static(join(__dirname, '..', 'public', 'admin'), { index: 'index.html', maxAge: '5m' }));
  // Same-origin web app (alpha on free hosting): serve the Flutter build with SPA fallback (PLAT-003).
  const webDir = env().WEB_DIST_DIR ? resolve(env().WEB_DIST_DIR!) : null;
  if (webDir && existsSync(join(webDir, 'index.html'))) {
    const reserved = /^\/(v1|admin|ws|health|ready|socket\.io)(\/|$)/;
    // Phone-frame preview of the web app for testing the mobile layout on a computer.
    app.use('/mobile', (req: express.Request, res: express.Response, next: express.NextFunction) => (req.path === '/' ? res.redirect(302, '/mobile.html') : next()));
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (reserved.test(req.path) || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
      // Flutter file names are not content-hashed: always revalidate (ETag) so a deploy is picked up immediately.
      express.static(webDir, { index: false, setHeaders: (r) => r.setHeader('cache-control', 'no-cache') })(req, res, () => {
        res.setHeader('cache-control', 'no-cache');
        res.sendFile(join(webDir, 'index.html'));
      });
    });
  }
  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');
}
