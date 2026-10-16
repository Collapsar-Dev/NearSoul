import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { REPORT_CATEGORIES, SafetyService } from './safety.service';

@Controller('v1')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  @Post('blocks')
  @HttpCode(204)
  async block(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { userId } = parse(z.object({ userId: z.string().uuid() }).strict(), body);
    await this.safety.block(user.id, userId);
  }

  @Get('blocks')
  list(@CurrentUser() user: AuthUser) {
    return this.safety.listBlocks(user.id);
  }

  @Delete('blocks/:userId')
  @HttpCode(204)
  async unblock(@CurrentUser() user: AuthUser, @Param('userId', new ParseUUIDPipe()) userId: string) {
    await this.safety.unblock(user.id, userId);
  }

  @Post('reports-moderation')
  report(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(
      z.object({
        userId: z.string().uuid(),
        category: z.enum(REPORT_CATEGORIES),
        comment: z.string().trim().max(500).optional(),
        matchId: z.string().uuid().optional(),
        alsoBlock: z.boolean().optional(),
      }).strict(),
      body,
    );
    return this.safety.report(user.id, input);
  }
}
