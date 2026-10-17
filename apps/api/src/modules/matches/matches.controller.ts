import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { ChatService } from './chat.service';
import { LikesService } from './likes.service';

@Controller('v1')
@RequireGate('active')
export class MatchesController {
  constructor(private readonly likes: LikesService, private readonly chat: ChatService) {}

  @Post('likes')
  @HttpCode(200)
  like(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(z.object({ targetId: z.string().uuid(), action: z.enum(['like', 'pass']), source: z.enum(['daily', 'nearby', 'profile']).default('daily') }).strict(), body);
    return this.likes.act(user.id, input.targetId, input.action, input.source);
  }

  @Get('likes/received')
  received(@CurrentUser() user: AuthUser) {
    return this.likes.received(user.id);
  }

  @Post('likes/rewind')
  @HttpCode(200)
  rewind(@CurrentUser() user: AuthUser) {
    return this.likes.rewind(user.id);
  }

  @Get('matches')
  matches(@CurrentUser() user: AuthUser) {
    return this.chat.list(user.id);
  }

  @Delete('matches/:id')
  @HttpCode(204)
  async unmatch(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.chat.unmatch(user.id, id);
  }

  @Get('matches/:id/messages')
  messages(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Query('cursor') cursor?: string) {
    return this.chat.messages(user.id, id, cursor && !Number.isNaN(Date.parse(cursor)) ? cursor : undefined);
  }

  @Post('matches/:id/messages')
  send(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const input = parse(z.object({ clientMessageId: z.string().uuid(), body: z.string().max(2000) }).strict(), body);
    return this.chat.send(user.id, id, input.clientMessageId, input.body);
  }

  @Post('matches/:id/read')
  @HttpCode(204)
  async read(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.chat.markRead(user.id, id);
  }
}
