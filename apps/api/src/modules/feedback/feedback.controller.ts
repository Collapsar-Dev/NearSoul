import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../../common/auth';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';
import { parse } from '../../common/zod';
import { ENGINE_VERSION } from '../../engine';

/** ALPHA-004 feedback and ALPHA-005 accuracy ratings. */
@Controller('v1')
export class FeedbackController {
  constructor(private readonly prisma: PrismaService, private readonly limiter: RateLimiter) {}

  @Post('feedback')
  @HttpCode(201)
  async feedback(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    this.limiter.check(`feedback:${user.id}`, 20, 86_400_000);
    const input = parse(
      z.object({
        category: z.enum(['bug', 'idea', 'confusing', 'engine_wrong', 'other']),
        text: z.string().trim().min(2).max(2000),
        appVersion: z.string().max(40).optional(),
        platform: z.string().max(20).optional(),
        screen: z.string().max(120).optional(),
      }).strict(),
      body,
    );
    const row = await this.prisma.feedback.create({ data: { userId: user.id, ...input } });
    return { id: row.id };
  }

  @Post('ratings')
  @HttpCode(201)
  async rating(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(
      z.object({
        kind: z.enum(['reveal_accuracy', 'pair_report_accuracy']),
        stars: z.number().int().min(1).max(5),
        comment: z.string().trim().max(300).optional(),
        matchId: z.string().uuid().optional(),
      }).strict(),
      body,
    );
    const row = await this.prisma.rating.create({ data: { userId: user.id, engineVersion: ENGINE_VERSION, ...input } });
    return { id: row.id };
  }
}
