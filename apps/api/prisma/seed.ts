/** Idempotent reference-data seed. Safe to run in every environment. */
import { PrismaClient, type Prisma } from '@prisma/client';
import { CITIES, INTERESTS } from '../src/content/seed-data';
import { DEFAULT_MATCH_CONFIG } from '../src/engine';

const prisma = new PrismaClient();

// CR-25: placeholder sponsored cards for the alpha, clearly marked as test ads (no real brands).
const TEST_ADS = [
  // Example of a partner with several places (fictional café, real public street names) to show the format.
  { id: '00000000-0000-7000-8000-00000000ad01', color: '#7A6248', sponsor: 'Café Example (sample partner)', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'First date at Café Example', ru: 'Первое свидание в «Кафе Пример»' }, body: { en: 'Show NearSoul at the counter: dessert for two on us. 3 places in Yerevan. (Sample ad)', ru: 'Покажи NearSoul на кассе — десерт на двоих в подарок. 3 места в Ереване. (Пример рекламы)' }, cta: { en: 'Places', ru: 'Адреса' },
    locations: [
      { name: 'Café Example · Northern Avenue', address: 'Northern Avenue, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Northern+Avenue+Yerevan' },
      { name: 'Café Example · Cascade', address: 'Tamanyan St, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tamanyan+Street+Yerevan' },
      { name: 'Café Example · Republic Square', address: 'Republic Square, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Republic+Square+Yerevan' },
    ] },
  { id: '00000000-0000-7000-8000-00000000ad02', color: '#4F6F5F', sponsor: 'NearSoul', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Flowers that say it for you', ru: 'Цветы, которые скажут за тебя' }, body: { en: 'Order a small bouquet for your match in two taps. (Test ad)', ru: 'Закажи небольшой букет для своей пары в два касания. (Тестовая реклама)' }, cta: { en: 'Order', ru: 'Заказать' } },
  { id: '00000000-0000-7000-8000-00000000ad03', color: '#5B6B8C', sponsor: 'NearSoul', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Tickets for two', ru: 'Билеты на двоих' }, body: { en: 'Concerts and exhibitions this weekend near you. (Test ad)', ru: 'Концерты и выставки рядом на этих выходных. (Тестовая реклама)' }, cta: { en: 'See events', ru: 'Смотреть' } },
];

async function main() {
  if (['alpha', 'development', 'test'].includes(process.env.APP_ENV ?? 'development')) {
    for (const a of TEST_ADS) {
      const locations = 'locations' in a ? a.locations : [];
      await prisma.adCard.upsert({ where: { id: a.id }, create: { ...a, locations, isTest: true }, update: { title: a.title, body: a.body, cta: a.cta, color: a.color, sponsor: a.sponsor, locations } });
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
