import type { ZodSchema } from 'zod';
import { badRequest } from './errors';

/** Validates input with a strict schema; unknown fields are rejected (no mass assignment). */
export function parse<T>(schema: ZodSchema<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) {
    throw badRequest('VALIDATION_FAILED', 'Some fields are invalid.', {
      fields: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  return r.data;
}
