import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/auth';
import { notFound } from '../../common/errors';
import { StorageService } from './storage.service';

/** Serves locally stored media through short-lived signed URLs (development/test only). */
@Controller('v1/media')
export class MediaController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get(':key')
  async get(@Param('key') key: string, @Query('exp') exp: string, @Query('sig') sig: string, @Res() res: Response) {
    const body = await this.storage.readLocalSigned(decodeURIComponent(key), Number(exp), String(sig ?? ''));
    if (!body) throw notFound();
    const zip = key.endsWith('.zip');
    res.setHeader('content-type', zip ? 'application/zip' : 'image/webp');
    if (zip) res.setHeader('content-disposition', 'attachment; filename="nearsoul-export.zip"');
    res.setHeader('cache-control', 'private, max-age=600');
    res.setHeader('cross-origin-resource-policy', 'cross-origin');
    res.send(body);
  }
}
