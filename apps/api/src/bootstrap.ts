import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
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
          scriptSrc: ["'self'", "'wasm-unsafe-eval'", 'https://www.gstatic.com', 'https://appleid.cdn-apple.com'],
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
    // SEO (CR-34): absolute URLs in the page, robots.txt and sitemap. While anyone can sign in with an on-screen code
    // (EMAIL_PROVIDER=screen/console) the site is kept out of search results.
    const publicUrl = env().APP_PUBLIC_URL.replace(/\/$/, '');
    const indexable = !['screen', 'console'].includes(env().EMAIL_PROVIDER) && ['alpha', 'production'].includes(env().APP_ENV);
    const indexHtml = readFileSync(join(webDir, 'index.html'), 'utf8').replaceAll('__PUBLIC_URL__', publicUrl);
    const sendIndex = (res: express.Response) => {
      res.setHeader('cache-control', 'no-cache');
      if (!indexable) res.setHeader('x-robots-tag', 'noindex, nofollow');
      res.type('html').send(indexHtml);
    };
    app.use('/robots.txt', (_req: express.Request, res: express.Response) => {
      res.type('text/plain').send(
        indexable
          ? `User-agent: *\nAllow: /\nDisallow: /v1/\nDisallow: /admin\nDisallow: /c/\nDisallow: /me\nDisallow: /matches\nSitemap: ${publicUrl}/sitemap.xml\n`
          : 'User-agent: *\nDisallow: /\n',
      );
    });
    app.use('/sitemap.xml', (_req: express.Request, res: express.Response) => {
      res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${publicUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>\n`);
    });
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (reserved.test(req.path) || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
      if (req.path === '/' || req.path === '/index.html') return sendIndex(res);
      // Flutter file names are not content-hashed: always revalidate (ETag) so a deploy is picked up immediately.
      express.static(webDir, { index: false, setHeaders: (r) => r.setHeader('cache-control', 'no-cache') })(req, res, () => sendIndex(res));
    });
  }
  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');
}
