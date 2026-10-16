import { Injectable } from '@nestjs/common';
import { tooMany } from './errors';

/**
 * In-memory sliding-window limiter. Enough for the single-instance alpha; swap for Redis when scaling out.
 * Durable limits that matter for security (login codes) are enforced from the database instead.
 */
@Injectable()
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  check(key: string, limit: number, windowMs: number, now = Date.now()): void {
    const list = (this.hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (list.length >= limit) {
      const retry = Math.ceil(((list[0] as number) + windowMs - now) / 1000);
      this.hits.set(key, list);
      throw tooMany(Math.max(1, retry));
    }
    list.push(now);
    this.hits.set(key, list);
  }

  reset(): void {
    this.hits.clear();
  }
}
