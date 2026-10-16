import { Controller, Get, Headers } from '@nestjs/common';
import { Public } from '../../common/auth';
import { PrismaService } from '../../common/prisma.service';
import { localeFrom } from '../engine/engine.controller';

@Controller('v1')
export class ReferenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('interests')
  async interests(@Headers('accept-language') lang?: string) {
    const locale = localeFrom(lang);
    const rows = await this.prisma.interest.findMany({ orderBy: [{ category: 'asc' }, { id: 'asc' }] });
    return rows.map((r) => ({ id: r.id, category: r.category, label: (r.labels as Record<string, string>)[locale] ?? (r.labels as Record<string, string>).en }));
  }

  @Public()
  @Get('cities')
  async cities(@Headers('accept-language') lang?: string) {
    const locale = localeFrom(lang);
    const rows = await this.prisma.city.findMany({ where: { active: true }, orderBy: { id: 'asc' } });
    return rows.map((r) => ({ id: r.id, name: (r.name as Record<string, string>)[locale] ?? (r.name as Record<string, string>).en, countryCode: r.countryCode }));
  }
}
