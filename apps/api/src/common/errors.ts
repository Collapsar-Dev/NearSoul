import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

/** Error with a stable machine code and a safe human message (PRD 13: error format). */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Not found') => new AppError(404, 'NOT_FOUND', what);
export const forbidden = (code = 'FORBIDDEN', msg = 'You can’t do that.') => new AppError(403, code, msg);
export const badRequest = (code: string, msg: string, details?: Record<string, unknown>) => new AppError(400, code, msg, details);
export const tooMany = (retryAfterSec: number) =>
  new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.', { retry_after: retryAfterSec });

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Error');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = req.requestId ?? 'unknown';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL';
    let message = 'Something went wrong.';
    let details: Record<string, unknown> | undefined;
    if (exception instanceof AppError) {
      ({ status, code, message, details } = exception);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = status === 404 ? 'NOT_FOUND' : status === 429 ? 'RATE_LIMITED' : `HTTP_${status}`;
      message = status === 404 ? 'Not found' : exception.message;
    } else {
      // Never leak stack traces or internals to clients.
      this.logger.error({ requestId, err: exception instanceof Error ? exception.message : String(exception) });
    }
    if (status === 429 && details?.retry_after) res.setHeader('Retry-After', String(details.retry_after));
    res.status(status).json({ error: { code, message, request_id: requestId, ...(details ? { details } : {}) } });
  }
}
