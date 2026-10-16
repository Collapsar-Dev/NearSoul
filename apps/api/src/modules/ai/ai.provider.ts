import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { ZodType } from 'zod/v4';
import { env } from '../../config/env';

export interface AiRequest<T> {
  feature: string;
  model?: string;
  promptVersion: string;
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
  timeoutMs?: number;
}

export type AiResult<T> = { ok: true; value: T; model: string } | { ok: false; reason: 'disabled' | 'budget' | 'timeout' | 'refusal' | 'invalid' | 'error' };

export interface ConverseRequest {
  feature: string;
  model: string;
  promptVersion: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
  timeoutMs?: number;
}

export type ConverseResult = { ok: true; text: string; model: string; inputTokens: number; outputTokens: number } | { ok: false; reason: 'disabled' | 'budget' | 'timeout' | 'refusal' | 'error' };

/** Internal AI interface (D11). Feature code never talks to a vendor SDK directly. */
export abstract class AiProvider {
  abstract generate<T>(req: AiRequest<T>): Promise<AiResult<T>>;
  abstract converse(req: ConverseRequest): Promise<ConverseResult>;
}

/** Rough cost guard: count spend per UTC day in memory (alpha is single-instance). */
class Budget {
  private day = '';
  private spentUsd = 0;
  // Claude Opus 5.5 list prices per token.
  private static IN = 4 / 1_000_000;
  private static OUT = 20 / 1_000_000;

  allowed(limitUsd: number): boolean {
    this.roll();
    return this.spentUsd < limitUsd;
  }

  add(inputTokens: number, outputTokens: number) {
    this.roll();
    this.spentUsd += inputTokens * Budget.IN + outputTokens * Budget.OUT;
  }

  private roll() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.spentUsd = 0;
    }
  }
}

@Injectable()
export class AnthropicProvider extends AiProvider {
  private readonly logger = new Logger('AI');
  private readonly budget = new Budget();
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: env().ANTHROPIC_API_KEY, maxRetries: 1 });
    return this.client;
  }

  async generate<T>(req: AiRequest<T>): Promise<AiResult<T>> {
    const e = env();
    if (!e.AI_ENABLED) return { ok: false, reason: 'disabled' };
    if (!this.budget.allowed(e.AI_DAILY_BUDGET_USD)) {
      this.logger.warn({ feature: req.feature, msg: 'AI daily budget reached, using fallback' });
      return { ok: false, reason: 'budget' };
    }
    const started = Date.now();
    try {
      const response = await this.getClient().beta.messages.create(
        {
          model: req.model ?? e.AI_MODEL_WRITER,
          max_tokens: req.maxTokens ?? 4000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'low', format: zodOutputFormat(req.schema) },
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
        },
        { timeout: req.timeoutMs ?? 8000 },
      );
      this.budget.add(response.usage.input_tokens, response.usage.output_tokens);
      // Log metadata only — never prompt or response text (PRD 14.1).
      this.logger.log({ feature: req.feature, promptVersion: req.promptVersion, model: response.model, ms: Date.now() - started, inTok: response.usage.input_tokens, outTok: response.usage.output_tokens, stop: response.stop_reason });
      if (response.stop_reason === 'refusal') return { ok: false, reason: 'refusal' };
      const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text;
      if (!text) return { ok: false, reason: 'invalid' };
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        return { ok: false, reason: 'invalid' };
      }
      const parsed = req.schema.safeParse(json);
      return parsed.success ? { ok: true, value: parsed.data, model: response.model } : { ok: false, reason: 'invalid' };
    } catch (err) {
      if (err instanceof Anthropic.APIConnectionTimeoutError) return { ok: false, reason: 'timeout' };
      if (err instanceof Anthropic.RateLimitError) this.logger.warn({ feature: req.feature, msg: 'AI rate limited' });
      else if (err instanceof Anthropic.APIError) this.logger.error({ feature: req.feature, status: err.status, msg: 'AI API error' });
      else this.logger.error({ feature: req.feature, msg: 'AI call failed' });
      return { ok: false, reason: 'error' };
    }
  }

  /** Multi-turn text conversation (Soul Talk guide, safety classifier). Same budget, logging and error rules. */
  async converse(req: ConverseRequest): Promise<ConverseResult> {
    const e = env();
    if (!e.AI_ENABLED) return { ok: false, reason: 'disabled' };
    if (!this.budget.allowed(e.AI_DAILY_BUDGET_USD)) return { ok: false, reason: 'budget' };
    const started = Date.now();
    // Server-side refusal fallback is only for the 5.x models that support it.
    const fallback = /^claude-(sonnet-5-5|opus-5|fable-5)/.test(req.model);
    try {
      const response = await this.getClient().beta.messages.create(
        {
          model: req.model,
          max_tokens: req.maxTokens ?? 2000,
          ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
          ...(/haiku/.test(req.model) ? {} : { output_config: { effort: 'low' as const } }),
          system: req.system,
          messages: req.messages,
        },
        { timeout: req.timeoutMs ?? 20000 },
      );
      this.budget.add(response.usage.input_tokens, response.usage.output_tokens);
      this.logger.log({ feature: req.feature, promptVersion: req.promptVersion, model: response.model, ms: Date.now() - started, inTok: response.usage.input_tokens, outTok: response.usage.output_tokens, stop: response.stop_reason });
      if (response.stop_reason === 'refusal') return { ok: false, reason: 'refusal' };
      const text = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('').trim();
      if (!text) return { ok: false, reason: 'error' };
      return { ok: true, text, model: response.model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
    } catch (err) {
      if (err instanceof Anthropic.APIConnectionTimeoutError) return { ok: false, reason: 'timeout' };
      if (err instanceof Anthropic.APIError) this.logger.error({ feature: req.feature, status: err.status, msg: 'AI API error' });
      else this.logger.error({ feature: req.feature, msg: 'AI call failed' });
      return { ok: false, reason: 'error' };
    }
  }
}

/** Test/dev provider: returns whatever the test configured. Never used in alpha/production. */
export class FakeAiProvider extends AiProvider {
  next: unknown = null;
  calls: AiRequest<unknown>[] = [];
  /** Queue of guide replies (or classifier JSON) for converse(); empty → disabled. */
  replies: string[] = [];
  converseCalls: ConverseRequest[] = [];

  async converse(req: ConverseRequest): Promise<ConverseResult> {
    this.converseCalls.push(req);
    const text = this.replies.shift();
    return text === undefined ? { ok: false, reason: 'disabled' } : { ok: true, text, model: 'fake', inputTokens: 10, outputTokens: 10 };
  }

  async generate<T>(req: AiRequest<T>): Promise<AiResult<T>> {
    this.calls.push(req as AiRequest<unknown>);
    if (this.next === null) return { ok: false, reason: 'disabled' };
    const parsed = req.schema.safeParse(this.next);
    return parsed.success ? { ok: true, value: parsed.data, model: 'fake' } : { ok: false, reason: 'invalid' };
  }
}
