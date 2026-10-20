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
  // More fictional cafés and flower shops (founder request 2026-10-20), each clearly marked as a sample ad.
  { id: '00000000-0000-7000-8000-00000000ad04', color: '#8A5A44', sponsor: 'Coffee House Example (sample partner)', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Second cappuccino on us', ru: 'Второй капучино — в подарок' }, body: { en: 'Come with your match to Coffee House Example: the second cappuccino is free. 2 places in Yerevan. (Sample ad)', ru: 'Приходите вдвоём в «Кофейню Пример»: второй капучино бесплатно. 2 места в Ереване. (Пример рекламы)' }, cta: { en: 'Places', ru: 'Адреса' },
    locations: [
      { name: 'Coffee House Example · Abovyan', address: 'Abovyan St, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Abovyan+Street+Yerevan' },
      { name: 'Coffee House Example · Mashtots', address: 'Mashtots Ave, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mashtots+Avenue+Yerevan' },
    ] },
  { id: '00000000-0000-7000-8000-00000000ad05', color: '#B5486A', sponsor: 'Flower Shop Example (sample partner)', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'A bouquet for your first date', ru: 'Букет к первому свиданию' }, body: { en: 'Flower Shop Example: −15% on small bouquets with NearSoul. 3 shops in Yerevan. (Sample ad)', ru: '«Цветочная лавка Пример»: −15% на небольшие букеты с NearSoul. 3 магазина в Ереване. (Пример рекламы)' }, cta: { en: 'Shops', ru: 'Магазины' },
    locations: [
      { name: 'Flower Shop Example · Komitas', address: 'Komitas Ave, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Komitas+Avenue+Yerevan' },
      { name: 'Flower Shop Example · Sayat-Nova', address: 'Sayat-Nova Ave, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sayat-Nova+Avenue+Yerevan' },
      { name: 'Flower Shop Example · Tumanyan', address: 'Tumanyan St, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tumanyan+Street+Yerevan' },
    ] },
  { id: '00000000-0000-7000-8000-00000000ad06', color: '#6E5A8C', sponsor: 'Pastry Shop Example (sample partner)', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Two desserts, one bill', ru: 'Два десерта — один счёт' }, body: { en: 'Pastry Shop Example: share a dessert set for two. Near Cascade. (Sample ad)', ru: '«Кондитерская Пример»: десертный сет на двоих. Рядом с Каскадом. (Пример рекламы)' }, cta: { en: 'Places', ru: 'Адреса' },
    locations: [
      { name: 'Pastry Shop Example · Cascade', address: 'Tamanyan St, Yerevan', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Cascade+Yerevan' },
    ] },
  { id: '00000000-0000-7000-8000-00000000ad07', color: '#3F7A6B', sponsor: 'Flowers Example (sample partner)', url: 'https://nearsoul-alpha-y6qr.onrender.com/',
    title: { en: 'Flowers delivered in 60 minutes', ru: 'Цветы с доставкой за 60 минут' }, body: { en: 'Surprise your match: Flowers Example delivers across Yerevan within an hour. (Sample ad)', ru: 'Удиви свою пару: «Цветы Пример» доставят по Еревану за час. (Пример рекламы)' }, cta: { en: 'Order', ru: 'Заказать' } },
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
