import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import pino from 'pino';

/**
 * Structured logs with redaction. Never log tokens, codes, emails, coordinates, answers or message bodies.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.APP_ENV === 'test' ? 'silent' : 'info'),
  redact: {
    paths: [
      'req.headers.authorization', 'req.headers.cookie', '*.email', '*.code', '*.token', '*.refreshToken',
      '*.accessToken', '*.lat', '*.lng', '*.body', '*.value', '*.answers', '*.text', '*.comment',
    ],
    censor: '[redacted]',
  },
});

export function requestContext(req: Request & { requestId?: string }, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  req.requestId = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', req.requestId);
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    // Route + status + latency only. Path params are ids, query strings are dropped.
    logger.info({
      requestId: req.requestId,
      method: req.method,
      route: req.route?.path ?? req.path.split('?')[0],
      status: res.statusCode,
      ms: Number((process.hrtime.bigint() - start) / 1_000_000n),
    });
  });
  next();
}
