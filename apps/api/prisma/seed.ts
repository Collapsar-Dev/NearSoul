/** Idempotent reference-data seed. Safe to run in every environment. */
import { PrismaClient, type Prisma } from '@prisma/client';
import { CITIES, INTERESTS } from '../src/content/seed-data';
import { DEFAULT_MATCH_CONFIG } from '../src/engine';

const prisma = new PrismaClient();

async function main() {
  for (const i of INTERESTS) {
    await prisma.interest.upsert({
      where: { id: i.id },
      create: { id: i.id, category: i.category, labels: { en: i.en, ru: i.ru } },
      update: { category: i.category, labels: { en: i.en, ru: i.ru } },
    });
  }
  for (const c of CITIES) {
    await prisma.city.upsert({
      where: { id: c.id },
      create: { id: c.id, name: { en: c.en, ru: c.ru }, countryCode: c.country, lat: c.lat, lng: c.lng },
      update: { name: { en: c.en, ru: c.ru }, countryCode: c.country, lat: c.lat, lng: c.lng },
    });
  }
  const cfg = DEFAULT_MATCH_CONFIG as unknown as Prisma.InputJsonValue;
  await prisma.matchConfigRow.upsert({ where: { version: DEFAULT_MATCH_CONFIG.version }, create: { version: DEFAULT_MATCH_CONFIG.version, config: cfg, active: true }, update: {} });
  console.log(`Seeded ${INTERESTS.length} interests, ${CITIES.length} cities, match_config ${DEFAULT_MATCH_CONFIG.version}`);
}

main().finally(() => prisma.$disconnect());
