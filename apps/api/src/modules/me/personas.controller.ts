import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { localeFrom } from '../engine/engine.controller';
import { PersonasService } from './personas.service';

const label = z.object({ label: z.string().trim().min(1).max(30) }).strict();

/** CR-17 personas: list, create, rename. Switching lives in /v1/auth/switch (it issues tokens). */
@Controller('v1/me/personas')
export class PersonasController {
  constructor(private readonly personas: PersonasService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    return this.personas.list(user.id, localeFrom(lang));
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.personas.create(user.id, parse(label, body).label);
  }

  @Patch(':id')
  rename(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown, @Headers('accept-language') lang?: string) {
    return this.personas.rename(user.id, id, parse(label, body).label, localeFrom(lang));
  }
}
