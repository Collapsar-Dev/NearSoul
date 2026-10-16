/**
 * ALPHA-002: seeds 48 clearly marked demo profiles with illustrated avatars (never photos of real people).
 * Refuses to run outside APP_ENV=alpha|development. Idempotent: existing demo users are replaced.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { QUICK_SCAN_ITEMS, scoreProfile, type Answers } from '../src/engine';
import { templateCard } from '../src/modules/ai/card.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { INTERESTS } from '../src/content/seed-data';

const env = process.env.APP_ENV ?? 'development';
if (!['alpha', 'development'].includes(env)) {
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
const PALETTES = [['#E8636F', '#3B3B98'], ['#F2A65A', '#4C5B8F'], ['#6BC3A5', '#2E3A59'], ['#B48EDB', '#1F2A44'], ['#F07F9A', '#5B4B8A'], ['#7FB5E6', '#33446B']];

async function avatar(initial: string, r: () => number, variant: number): Promise<Buffer> {
  const [c1, c2] = PALETTES[Math.floor(r() * PALETTES.length)]!;
  const shapes = Array.from({ length: 6 }, () => {
    const x = Math.round(r() * 800), y = Math.round(r() * 800), s = 60 + Math.round(r() * 160);
    return `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity="${(0.06 + r() * 0.12).toFixed(2)}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
    <defs><linearGradient id="g" x1="0" y1="0" x2="${variant}" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="800" height="1000" fill="url(#g)"/>${shapes}
    <circle cx="400" cy="430" r="190" fill="#fff" opacity="0.18"/>
    <text x="400" y="500" font-family="Georgia, serif" font-size="220" fill="#fff" text-anchor="middle">${initial}</text>
    <text x="400" y="900" font-family="Arial, sans-serif" font-size="44" fill="#fff" opacity="0.85" text-anchor="middle">DEMO PROFILE</text>
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
}

async function main() {
  const prisma = new PrismaClient();
  const storage = new StorageService();
  const r = rng(20261016);
  const old = await prisma.user.findMany({ where: { isDemo: true }, include: { photos: true } });
  for (const u of old) for (const p of u.photos) await storage.delete(p.storageKey).catch(() => undefined);
  await prisma.user.deleteMany({ where: { isDemo: true } });
  const intents = ['long_term', 'open_to_long', 'not_sure', 'open_to_long', 'long_term', 'casual'] as const;
  const now = new Date();
  for (let i = 0; i < 48; i++) {
    const g = i % 12 === 11 ? 'non_binary' : i % 2 === 0 ? 'woman' : 'man';
    const name = g === 'woman' ? WOMEN[i % WOMEN.length]! : g === 'man' ? MEN[i % MEN.length]! : NB[i % NB.length]!;
    const interestedIn = g === 'non_binary' ? ['woman', 'man', 'non_binary'] : r() < 0.85 ? [g === 'woman' ? 'man' : 'woman'] : ['woman', 'man'];
    const age = 21 + Math.floor(r() * 24);
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
        email: `demo+${i}@demo.nearsoul.invalid`,
        status: 'active', isDemo: true, onboardingStep: 'done', dob, ageGatePassedAt: now, discoveryEnabled: true,
        shareLevel: 'standard', cardVisibility: 'everyone', lastActiveAt: new Date(now.getTime() - Math.floor(r() * 5) * 86_400_000),
        consents: { create: [{ type: 'terms', version: process.env.TERMS_VERSION ?? '2026-10-alpha', granted: true }] },
        profile: {
          create: {
            firstName: name, gender: g, interestedIn: interestedIn as ('woman' | 'man' | 'non_binary')[], intent: intents[i % intents.length]!,
            bio: BIOS[i % BIOS.length]!, ageMin: Math.max(18, age - 7), ageMax: age + 8, cityId: process.env.LAUNCH_CITY ?? 'amsterdam',
            interests: { create: interests.map((interestId) => ({ interestId })) },
          },
        },
        answers: { create: Object.entries(answers).map(([itemKey, a]) => ({ itemKey, itemVersion: 1, value: a.value as Prisma.InputJsonValue })) },
        soulProfile: { create: { profile: profile as unknown as Prisma.InputJsonValue, archetype: profile.archetype, depth: profile.depth, engineVersion: profile.engineVersion, normsVersion: profile.normsVersion } },
        card: { create: { headline: card.headline, summary: card.summary, communicationStyle: card.communication_style, idealFirstDate: card.ideal_first_date, strengths: card.strengths, source: 'template', promptVersion: 'template_v1', reviewed: true } },
      },
    });
    for (let p = 0; p < 2; p++) {
      const key = `photos/${user.id}/${randomUUID()}.webp`;
      await storage.put(key, await avatar(name[0]!, r, p), 'image/webp');
      await prisma.photo.create({ data: { userId: user.id, storageKey: key, position: p, status: 'ready', width: 800, height: 1000 } });
    }
  }
  await prisma.$disconnect();
  console.log('Seeded 48 demo profiles.');
}

void main();
