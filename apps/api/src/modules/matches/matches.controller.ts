import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { ChatService } from './chat.service';
import { LikesService } from './likes.service';
import { RequestsService } from './requests.service';

@Controller('v1')
@RequireGate('active')
export class MatchesController {
  constructor(private readonly likes: LikesService, private readonly chat: ChatService, private readonly requests: RequestsService) {}

  @Post('likes')
  @HttpCode(200)
  like(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(z.object({ targetId: z.string().uuid(), action: z.enum(['like', 'pass']), source: z.enum(['daily', 'nearby', 'profile']).default('daily') }).strict(), body);
    return this.likes.act(user.id, input.targetId, input.action, input.source);
  }

  /** VIP: write first (CR-26). */
  @Post('requests')
  @HttpCode(200)
  sendRequest(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(z.object({ targetId: z.string().uuid(), body: z.string().max(1000) }).strict(), body);
    return this.requests.send(user.id, input.targetId, input.body);
  }

  @Get('requests')
  incomingRequests(@CurrentUser() user: AuthUser) {
    return this.requests.incoming(user.id);
  }

  @Post('requests/:id/accept')
  @HttpCode(200)
  acceptRequest(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.requests.accept(user.id, id);
  }

  @Post('requests/:id/decline')
  @HttpCode(204)
  async declineRequest(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.requests.decline(user.id, id);
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
