/** Writes docs/engine/golden-pairs.md for founder review: npm run engine:golden */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { codeText } from '../src/content/texts';
import { ARCHETYPES, tr } from '../src/content/texts';
import { PERSONAS } from '../src/engine/golden/personas';
import { INTERESTS } from '../src/content/seed-data';
import { goldenResults } from '../src/engine/golden/results';
import type { ArchetypeKey } from '../src/engine';

const tierRu: Record<string, string> = { strong: 'Сильное совпадение', good: 'Хорошее совпадение', some: 'Есть общее', low: 'Разные волны' };
const interests = Object.fromEntries(INTERESTS.map((i) => [i.id, { en: i.en, ru: i.ru }]));
const names = new Map(PERSONAS.map((p) => [p.key, p.name]));
const lines: string[] = [
  '# Эталонные пары: проверка движка совместимости',
  '',
  'Сгенерировано из `apps/api/src/engine/golden` (команда `npm run engine:golden`). 10 вымышленных людей, 20 пар.',
  'Проверьте: **кажется ли вам уровень совместимости и причины разумными?** Если какая-то пара выглядит неправильно — напишите, какую и почему; веса настраиваются в `match_config`.',
  '',
  '## Персоны',
  '',
  ...PERSONAS.map((p) => `- **${p.name}** — ${p.story} (намерение: ${p.intent})`),
  '',
  '## Результаты',
  '',
  '| Пара | Допуск | Балл | Уровень | Архетипы | Почему совпадают | Где могут различаться |',
  '|---|---|---|---|---|---|---|',
];
for (const r of goldenResults()) {
  const [a, b] = r.pair.split('+') as [string, string];
  const [arA, arB] = r.archetypes.split('/') as [ArchetypeKey, ArchetypeKey];
  const reasons = r.reasons.map((c) => codeText(c, 'ru', { interests })).join('<br>') || '—';
  const frictions = r.frictions.map((c) => codeText(c, 'ru')).join('<br>') || '—';
  lines.push(`| ${names.get(a)!.split(' —')[0]} + ${names.get(b)!.split(' —')[0]} | ${r.eligible === true ? 'да' : `нет (${r.eligible})`} | ${r.score} | ${tierRu[r.tier]} | ${tr(ARCHETYPES[arA].name, 'ru')} / ${tr(ARCHETYPES[arB].name, 'ru')} | ${reasons} | ${frictions} |`);
}
lines.push('', '«Допуск: нет (INTENT)» — пара не будет показана друг другу из-за несовместимых намерений, как бы ни совпадал характер.', '');
writeFileSync(join(__dirname, '../../../docs/engine/golden-pairs.md'), lines.join('\n'));
console.log('docs/engine/golden-pairs.md written');
