import type { z, ZodTypeAny } from 'zod';
import { badRequest } from './errors';

/** Validates input with a strict schema; unknown fields are rejected (no mass assignment). */
export function parse<S extends ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  const r = schema.safeParse(input);
  if (!r.success) {
    throw badRequest('VALIDATION_FAILED', 'Some fields are invalid.', {
      fields: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  return r.data;
}
