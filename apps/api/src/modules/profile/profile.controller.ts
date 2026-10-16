import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { NAME_RE } from './text-safety';
import { ProfileService } from './profile.service';

const GENDER = z.enum(['woman', 'man', 'non_binary']);
const ProfileSchema = z.object({
  firstName: z.string().trim().regex(NAME_RE, 'Use letters only (1–30).'),
  gender: GENDER,
  interestedIn: z.array(GENDER).min(1).max(3),
  intent: z.enum(['long_term', 'open_to_long', 'casual', 'not_sure']),
  bio: z.string().trim().max(300),
  ageMin: z.number().int().min(18).max(99),
  ageMax: z.number().int().min(18).max(99),
  cityId: z.string().max(40),
  heightCm: z.number().int().min(120).max(230).nullable(),
  jobTitle: z.string().trim().max(40).nullable(),
  interests: z.array(z.string().max(40)).min(3).max(10),
}).partial().strict();

@Controller('v1')
@RequireGate('age')
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get('me/profile')
  get(@CurrentUser() user: AuthUser) {
    return this.profiles.getOwn(user.id);
  }

  @Put('me/profile')
  put(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.profiles.upsert(user.id, parse(ProfileSchema, body));
  }

  @Patch('me/profile')
  patch(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.profiles.upsert(user.id, parse(ProfileSchema, body));
  }

  @Post('photos')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  upload(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    return this.profiles.addPhoto(user.id, file);
  }

  @Patch('photos/order')
  order(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { ids } = parse(z.object({ ids: z.array(z.string().uuid()).min(1).max(6) }).strict(), body);
    return this.profiles.reorder(user.id, ids);
  }

  @Delete('photos/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.profiles.deletePhoto(user.id, id);
  }
}
