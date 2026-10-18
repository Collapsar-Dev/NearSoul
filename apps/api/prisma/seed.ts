/** Idempotent reference-data seed. Safe to run in every environment. */
import { PrismaClient, type Prisma } from '@prisma/client';
import { CITIES, INTERESTS } from '../src/content/seed-data';
import { DEFAULT_MATCH_CONFIG } from '../src/engine';

const prisma = new PrismaClient();

// CR-25: placeholder sponsored cards for the alpha, clearly marked as test ads (no real brands).
const TEST_ADS = [
  { id: '00000000-0000-7000-8000-00000000ad01', color: '#7A6248', sponsor: 'NearSoul', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Your first date, sorted', ru: 'Первое свидание — без хлопот' }, body: { en: 'A cosy café partner with a small treat for NearSoul couples. (Test ad)', ru: 'Уютное кафе-партнёр с маленьким сюрпризом для пар из NearSoul. (Тестовая реклама)' }, cta: { en: 'Learn more', ru: 'Подробнее' } },
  { id: '00000000-0000-7000-8000-00000000ad02', color: '#4F6F5F', sponsor: 'NearSoul', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Flowers that say it for you', ru: 'Цветы, которые скажут за тебя' }, body: { en: 'Order a small bouquet for your match in two taps. (Test ad)', ru: 'Закажи небольшой букет для своей пары в два касания. (Тестовая реклама)' }, cta: { en: 'Order', ru: 'Заказать' } },
  { id: '00000000-0000-7000-8000-00000000ad03', color: '#5B6B8C', sponsor: 'NearSoul', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Tickets for two', ru: 'Билеты на двоих' }, body: { en: 'Concerts and exhibitions this weekend near you. (Test ad)', ru: 'Концерты и выставки рядом на этих выходных. (Тестовая реклама)' }, cta: { en: 'See events', ru: 'Смотреть' } },
];

async function main() {
  if (['alpha', 'development', 'test'].includes(process.env.APP_ENV ?? 'development')) {
    for (const a of TEST_ADS) {
      await prisma.adCard.upsert({ where: { id: a.id }, create: { ...a, isTest: true }, update: { title: a.title, body: a.body, cta: a.cta, color: a.color } });
    }
  }
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
