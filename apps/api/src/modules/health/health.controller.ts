import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth';
import { PrismaService } from '../../common/prisma.service';
import { env } from '../../config/env';
import { ENGINE_VERSION } from '../../engine';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`select 1`;
    return { status: 'ready', env: env().APP_ENV, engine: ENGINE_VERSION };
  }
}
