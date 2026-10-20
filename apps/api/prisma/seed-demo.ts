/**
 * ALPHA-002: seeds DEMO_COUNT (default 400) clearly marked demo profiles with illustrated avatars (never photos of
 * real people). Some demo people also get a second profile (CR-17) so VIP's profile count can be tried.
 * Refuses to run outside APP_ENV=alpha|development. Tops up missing demos on every start; --force recreates all.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import sharp from 'sharp';
import { avatarSvg } from './avatar';
import { randomUUID } from 'node:crypto';
import { QUICK_SCAN_ITEMS, scoreProfile, type Answers } from '../src/engine';
import { templateCard } from '../src/modules/ai/card.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { INTERESTS } from '../src/content/seed-data';

const env = process.env.APP_ENV ?? 'development';
if (!['alpha', 'development'].includes(env)) {
  // Production must never contain demo profiles (ALPHA-002).
  console.error(`Refusing to seed demo profiles in APP_ENV=${env}.`);
  process.exit(1);
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WOMEN = ['Mila', 'Sofia', 'Lena', 'Noor', 'Iris', 'Eva', 'Yara', 'Maya', 'Lotte', 'Anouk', 'Nina', 'Zara', 'Alina', 'Sara', 'Emma', 'Lea', 'Ines', 'Mara', 'Julia', 'Tess'];
const MEN = ['Daan', 'Liam', 'Noah', 'Sem', 'Lucas', 'Milan', 'Finn', 'Adam', 'Levi', 'Omar', 'David', 'Max', 'Jonas', 'Elias', 'Ruben', 'Thijs', 'Arman', 'Leo', 'Bram', 'Tim'];
const NB = ['Robin', 'Alex', 'Sam', 'Charlie', 'Quinn', 'Jules', 'Kai', 'Noa'];
const WOMEN_AM = ['Ани', 'Мариам', 'Лилит', 'Наре', 'Анаит', 'Асмик', 'Гаяне', 'Татев', 'Элен', 'Сона', 'Мане', 'Арпи', 'Луиза', 'Кристине', 'Ева', 'Нарине', 'Шушан', 'Ануш', 'Мелине', 'Седа'];
const MEN_AM = ['Арам', 'Давид', 'Тигран', 'Айк', 'Нарек', 'Гор', 'Ваге', 'Левон', 'Арсен', 'Карен', 'Самвел', 'Эрик', 'Ашот', 'Грант', 'Вардан', 'Артур', 'Рубен', 'Мгер', 'Севак', 'Армен'];
const JOBS = ['Дизайнер', 'Разработчик', 'Врач', 'Учитель', 'Архитектор', 'Фотограф', 'Маркетолог', 'Бариста', 'Инженер', 'Психолог', 'Юрист', 'Музыкант', 'Product manager', 'Data analyst', 'Chef', 'Nurse', 'Pilot', 'Student'];
const MORE_BIOS = [
  'Варю лучший кофе в районе и ищу, с кем его пить.',
  'Горы по выходным, книги по вечерам, честность всегда.',
  'Люблю старые фильмы, новые города и долгие прогулки по Еревану.',
  'Ищу человека, с которым можно и помолчать, и спорить до утра.',
  'Играю на гитаре, плохо пою, хорошо готовлю долму.',
  'Танцую сальсу и учу испанский. Расскажи мне про своё место силы.',
  'Running in the morning, board games at night.',
  'I collect vinyl and bad puns. Looking for someone curious.',
  'Weekend trips, slow breakfasts, honest talks.',
  'Volunteer at an animal shelter. Dog people welcome 🐶',
];
const WOMEN_RU = ['Аня', 'Даша', 'Катя', 'Полина', 'Вика', 'Оля', 'Маша', 'Лиза', 'Настя', 'Ксения'];
const MEN_RU = ['Артём', 'Дима', 'Саша', 'Миша', 'Илья', 'Кирилл', 'Никита', 'Егор', 'Влад', 'Паша'];
const BIOS_RU = [
  'Люблю длинные прогулки, хороший кофе и честные разговоры.',
  'По выходным в горах, по вечерам с книгой.',
  'Готовлю лучше, чем пою. Пою часто.',
  'Ищу человека, с которым интересно молчать и смеяться.',
  'Велосипед, джаз и путешествия без плана.',
  'Учусь рисовать, коллекционирую виниловые пластинки.',
];
const BIOS = [
  'Weekend hiker, weekday coffee snob. Looking for good conversations.',
  'Museums, long walks and trying every bakery in town.',
  'Learning to cook something new every week. Ask me about my failures.',
  'Cyclist, bookworm, occasional karaoke hero.',
  'I like slow mornings, live music and honest people.',
  'Always planning the next trip. Currently: Lisbon.',
  'Board games, sunsets on the IJ and terrible puns.',
  'Yoga in the morning, jazz at night.',
];


/** Illustrated, clearly fictional portrait (never a photo of a real person), see prisma/avatar.ts (CR-37). */
async function avatar(gender: 'woman' | 'man' | 'non_binary', r: () => number, variant: number): Promise<Buffer> {
  return sharp(Buffer.from(avatarSvg(gender, r, variant))).webp({ quality: 82 }).toBuffer();
}

/** Spreads names so neighbours in the feed rarely share one (plain `i % n` repeated with the language stride). */
const pickName = (list: string[], i: number) => list[Math.floor(rng(i * 31 + 5)() * list.length)]!;
const NAME_LISTS = [WOMEN, MEN, NB, WOMEN_AM, MEN_AM, WOMEN_RU, MEN_RU];

async function main() {
  const prisma = new PrismaClient();
  const storage = new StorageService(prisma);
  const target = Number(process.env.DEMO_COUNT ?? 200);
  if (process.argv.includes('--force')) {
    const old = await prisma.user.findMany({ where: { isDemo: true }, include: { photos: true } });
    for (const u of old) for (const p of u.photos) await storage.delete(p.storageKey).catch(() => undefined);
    await prisma.user.deleteMany({ where: { isDemo: true, parentId: { not: null } } });
    await prisma.user.deleteMany({ where: { isDemo: true } });
  }
  const intents = ['long_term', 'open_to_long', 'not_sure', 'open_to_long', 'long_term', 'casual'] as const;
  const now = new Date();
  let created = 0;

  /** One demo profile; `parentId` makes it a second profile of an existing demo person. */
  async function createDemo(i: number, r: () => number, g: 'woman' | 'man' | 'non_binary', name: string, bio: string, age: number, parentId?: string) {
    const interestedIn = g === 'non_binary' ? ['woman', 'man', 'non_binary'] : r() < 0.85 ? [g === 'woman' ? 'man' : 'woman'] : ['woman', 'man'];
    const dob = new Date(Date.UTC(now.getUTCFullYear() - age, Math.floor(r() * 12), 1 + Math.floor(r() * 27)));
    const answers: Answers = {};
    for (const item of QUICK_SCAN_ITEMS) {
      if (item.optional) continue;
      const at = now.toISOString();
      if (item.type === 'likert5') answers[item.key] = { value: 1 + Math.floor(r() * 5), answeredAt: at };
      else if (item.type === 'single') answers[item.key] = { value: item.options![Math.floor(r() * item.options!.length)]!.key, answeredAt: at };
      else {
        const shuffled = [...item.options!].sort(() => r() - 0.5);
        const n = item.minSelect === item.maxSelect ? item.minSelect! : 1 + Math.floor(r() * (item.maxSelect ?? 1));
        answers[item.key] = { value: shuffled.slice(0, n).map((o) => o.key), answeredAt: at };
      }
    }
    const profile = scoreProfile(answers);
    const card = templateCard(profile, 'en');
    const interests = [...INTERESTS].sort(() => r() - 0.5).slice(0, 3 + Math.floor(r() * 5)).map((x) => x.id);
    const user = await prisma.user.create({
      data: {
        email: parentId ? null : `demo+${i}@demo.nearsoul.invalid`,
        parentId: parentId ?? null,
        personaLabel: parentId ? 'Demo 2' : null,
        status: 'active', isDemo: true, onboardingStep: 'done', dob, ageGatePassedAt: now, discoveryEnabled: true,
        shareLevel: 'standard', cardVisibility: 'everyone', lastActiveAt: new Date(now.getTime() - Math.floor(r() * 5) * 86_400_000),
        consents: { create: [{ type: 'terms', version: process.env.TERMS_VERSION ?? '2026-10-alpha', granted: true }] },
        profile: {
          create: {
            firstName: name, gender: g, interestedIn: interestedIn as ('woman' | 'man' | 'non_binary')[], intent: intents[i % intents.length]!,
            // Demos accept any adult tester so Today's Souls is full.
            bio, ageMin: 18, ageMax: 70, cityId: process.env.LAUNCH_CITY ?? 'amsterdam',
            jobTitle: JOBS[Math.floor(r() * JOBS.length)]!,
            heightCm: g === 'man' ? 170 + Math.floor(r() * 25) : 155 + Math.floor(r() * 25),
            interests: { create: interests.map((interestId) => ({ interestId })) },
          },
        },
        answers: { create: Object.entries(answers).map(([itemKey, a]) => ({ itemKey, itemVersion: 1, value: a.value as Prisma.InputJsonValue, locale: 'en' })) },
        soulProfile: { create: { profile: profile as unknown as Prisma.InputJsonValue, archetype: profile.archetype, depth: profile.depth, engineVersion: profile.engineVersion, normsVersion: profile.normsVersion } },
        card: { create: { headline: card.headline, summary: card.summary, communicationStyle: card.communication_style, idealFirstDate: card.ideal_first_date, strengths: card.strengths, source: 'template', promptVersion: 'template_v1', reviewed: true } },
      },
    });
    for (let p = 0; p < 2; p++) {
      const key = `photos/${user.id}/${randomUUID()}.webp`;
      await storage.put(key, await avatar(g, r, p), 'image/webp');
      await prisma.photo.create({ data: { userId: user.id, storageKey: key, position: p, status: 'ready', width: 800, height: 1000 } });
    }
    created++;
    return user;
  }

  // One-time upgrade of older demos: illustrated portraits instead of letters, plus job and height.
  const AVATAR_VERSION = '10';
  const marker = await prisma.appSecret.findUnique({ where: { key: 'demo_avatar_version' } });
  if (marker?.value !== AVATAR_VERSION) {
    const old = await prisma.user.findMany({ where: { isDemo: true }, include: { photos: true, profile: { select: { gender: true } } } });
    for (const [n, u] of old.entries()) {
      const r = rng(777 + n);
      const g = (u.profile?.gender ?? 'woman') as 'woman' | 'man' | 'non_binary';
      for (const ph of u.photos) {
        await storage.put(ph.storageKey, await avatar(g, r, ph.position), 'image/webp');
      }
      await prisma.profile.updateMany({ where: { userId: u.id, jobTitle: null }, data: { jobTitle: JOBS[n % JOBS.length]!, heightCm: g === 'man' ? 170 + (n % 25) : 155 + (n % 25) } });
    }
    await prisma.profile.updateMany({ where: { user: { isDemo: true } }, data: { ageMin: 18, ageMax: 70 } });
    // Re-spread names within each person's original language list; second profiles keep their parent's name.
    const roots = await prisma.user.findMany({ where: { isDemo: true, parentId: null }, select: { id: true, email: true, profile: { select: { firstName: true } } } });
    for (const u of roots) {
      const i = Number(/demo\+(\d+)@/.exec(u.email ?? '')?.[1] ?? -1);
      const list = NAME_LISTS.find((l) => l.includes(u.profile?.firstName ?? ''));
      if (i < 0 || !list) continue;
      const firstName = pickName(list, i);
      await prisma.profile.updateMany({ where: { OR: [{ userId: u.id }, { user: { parentId: u.id } }] }, data: { firstName } });
    }
    await prisma.appSecret.upsert({ where: { key: 'demo_avatar_version' }, create: { key: 'demo_avatar_version', value: AVATAR_VERSION }, update: { value: AVATAR_VERSION } });
    console.log(`Refreshed ${old.length} demo portraits.`);
  }

  // Keep exactly `target` demo people: remove extras from earlier, larger runs (their second profiles go with them).
  const extra = (await prisma.user.findMany({ where: { isDemo: true, parentId: null }, select: { id: true, email: true } }))
    .filter((u) => Number(/demo\+(\d+)@/.exec(u.email ?? '')?.[1] ?? -1) >= target);
  if (extra.length) {
    const ids = extra.map((u) => u.id);
    const photos = await prisma.photo.findMany({ where: { user: { OR: [{ id: { in: ids } }, { parentId: { in: ids } }] } }, select: { storageKey: true } });
    for (const ph of photos) await storage.delete(ph.storageKey).catch(() => undefined);
    await prisma.user.deleteMany({ where: { parentId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`Removed ${extra.length} extra demo profiles.`);
  }

  for (let i = 0; i < target; i++) {
    if (await prisma.user.findUnique({ where: { email: `demo+${i}@demo.nearsoul.invalid` }, select: { id: true } })) continue;
    const r = rng(20261016 + i * 7919);
    const g = i % 12 === 11 ? 'non_binary' : i % 2 === 0 ? 'woman' : 'man';
    // From #48 on, every other demo is Russian-speaking so ru testers see familiar names and bios.
    const ru = i >= 48 && Math.floor(i / 2) % 2 === 1;
    const am = i >= 100 && Math.floor(i / 2) % 3 === 0;
    const name = g === 'woman'
      ? pickName(am ? WOMEN_AM : ru ? WOMEN_RU : WOMEN, i)
      : pickName(g === 'man' ? (am ? MEN_AM : ru ? MEN_RU : MEN) : NB, i);
    const bio = i >= 100 ? MORE_BIOS[i % MORE_BIOS.length]! : ru ? BIOS_RU[i % BIOS_RU.length]! : BIOS[i % BIOS.length]!;
    const age = 21 + Math.floor(r() * 24);
    const user = await createDemo(i, r, g, name, bio, age);
    // Every 6th new demo person has a second profile (same person, different answers).
    if (i >= 48 && i % 6 === 0 && g !== 'non_binary') await createDemo(i, r, g, name, ru ? BIOS_RU[(i + 1) % BIOS_RU.length]! : BIOS[(i + 1) % BIOS.length]!, age, user.id);
  }
  // CR-30: about 60% of demo people carry the verified badge (deterministic by id, so reruns don't change it).
  await prisma.$executeRawUnsafe(`UPDATE users SET verified_at = now() WHERE is_demo AND verified_at IS NULL AND get_byte(decode(md5(id::text), 'hex'), 0) % 5 < 3`);
  await prisma.$disconnect();
  console.log(created ? `Seeded ${created} demo profiles.` : 'Demo profiles already complete.');
}

void main();
