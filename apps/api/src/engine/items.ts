/**
 * Quick Scan item bank v1 (PRD appendix A).
 *
 * Block A uses the Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006), built from public-domain
 * IPIP items (https://ipip.ori.org). Item texts must be verified against the official source
 * before production use (see docs/engine/sources.md).
 */
import { DEEP_ITEMS } from './deep-items';
import type { MeasuredDomain } from './types';

export type ItemType = 'likert5' | 'single' | 'multi';
export type ItemBlock = 'A' | 'B' | 'C' | 'D' | 'X' | 'P1' | 'P2' | 'P3' | 'P4';

export interface LocalizedText {
  en: string;
  /** null = no approved translation yet; clients fall back to English and mark it. */
  ru: string | null;
}

export interface ItemOption {
  key: string;
  label: LocalizedText;
}

export interface ItemDef {
  key: string;
  instrument: 'mini_ipip' | 'ns_custom' | 'ipip_neo_120';
  version: number;
  block: ItemBlock;
  /** Trait the item measures. For Big Five items this is the measured domain. */
  trait: string;
  domain?: MeasuredDomain;
  keyed?: 1 | -1;
  type: ItemType;
  prompt: LocalizedText;
  options?: ItemOption[];
  /** For multi: exact or max number of selections. */
  minSelect?: number;
  maxSelect?: number;
  optional?: boolean;
  /** Likert anchors when they differ from the default accuracy scale. */
  anchors?: { low: LocalizedText; high: LocalizedText };
}

const t = (en: string, ru: string | null = null): LocalizedText => ({ en, ru });
const opt = (key: string, en: string, ru: string): ItemOption => ({ key, label: t(en, ru) });

/** ru: DRAFT translation (not validated, CR-8): answers in ru are flagged for separate norms later. */
const mini = (n: number, en: string, domain: MeasuredDomain, keyed: 1 | -1, ru: string | null = null): ItemDef => ({
  key: `mi_${String(n).padStart(2, '0')}`,
  instrument: 'mini_ipip',
  version: 1,
  block: 'A',
  trait: domain,
  domain,
  keyed,
  type: 'likert5',
  prompt: t(en, ru),
});

export const LIKERT_ACCURACY_LABELS: LocalizedText[] = [
  t('Very inaccurate', 'Совсем не про меня'),
  t('Moderately inaccurate', 'Скорее не про меня'),
  t('Neither', 'Ни то, ни другое'),
  t('Moderately accurate', 'Скорее про меня'),
  t('Very accurate', 'Точно про меня'),
];

export const QUICK_SCAN_ITEMS: readonly ItemDef[] = [
  // Block A: How you are (Mini-IPIP)
  mini(1, 'Am the life of the party.', 'E', 1, 'Я душа компании.'),
  mini(2, "Sympathize with others' feelings.", 'A', 1, 'Я сопереживаю чувствам других.'),
  mini(3, 'Get chores done right away.', 'C', 1, 'Я сразу берусь за повседневные дела.'),
  mini(4, 'Have frequent mood swings.', 'N', 1, 'У меня часто меняется настроение.'),
  mini(5, 'Have a vivid imagination.', 'O', 1, 'У меня богатое воображение.'),
  mini(6, "Don't talk a lot.", 'E', -1, 'Я немногословен(на).'),
  mini(7, "Am not interested in other people's problems.", 'A', -1, 'Чужие проблемы мне неинтересны.'),
  mini(8, 'Often forget to put things back in their proper place.', 'C', -1, 'Я часто забываю класть вещи на место.'),
  mini(9, 'Am relaxed most of the time.', 'N', -1, 'Большую часть времени я спокоен(на).'),
  mini(10, 'Am not interested in abstract ideas.', 'O', -1, 'Абстрактные идеи мне неинтересны.'),
  mini(11, 'Talk to a lot of different people at parties.', 'E', 1, 'На вечеринках я общаюсь со множеством разных людей.'),
  mini(12, "Feel others' emotions.", 'A', 1, 'Я чувствую эмоции других людей.'),
  mini(13, 'Like order.', 'C', 1, 'Я люблю порядок.'),
  mini(14, 'Get upset easily.', 'N', 1, 'Меня легко расстроить.'),
  mini(15, 'Have difficulty understanding abstract ideas.', 'O', -1, 'Мне трудно понимать абстрактные идеи.'),
  mini(16, 'Keep in the background.', 'E', -1, 'Я держусь в тени.'),
  mini(17, 'Am not really interested in others.', 'A', -1, 'Другие люди мне не особенно интересны.'),
  mini(18, 'Make a mess of things.', 'C', -1, 'Я часто устраиваю беспорядок.'),
  mini(19, 'Seldom feel blue.', 'N', -1, 'Мне редко бывает грустно.'),
  mini(20, 'Do not have a good imagination.', 'O', -1, 'У меня не очень хорошее воображение.'),

  // Block B: How you love
  {
    key: 'rel_01', instrument: 'ns_custom', version: 1, block: 'B', trait: 'closeness_comfort', type: 'likert5',
    prompt: t('I feel comfortable being close to a partner and relying on each other.',
      'Мне комфортно быть близко с партнёром и полагаться друг на друга.'),
  },
  {
    key: 'rel_02', instrument: 'ns_custom', version: 1, block: 'B', trait: 'reassurance_need', type: 'likert5',
    prompt: t("When I'm close to someone, I like frequent signs that they care.",
      'Когда у меня близкие отношения, мне важны частые знаки внимания.'),
  },
  {
    key: 'rel_03', instrument: 'ns_custom', version: 1, block: 'B', trait: 'independence_need', type: 'likert5',
    prompt: t('Even in a relationship, I need plenty of time on my own.',
      'Даже в отношениях мне нужно много времени для себя.'),
  },
  {
    key: 'rel_04', instrument: 'ns_custom', version: 1, block: 'B', trait: 'conflict_style', type: 'single',
    prompt: t("When there's a disagreement, I usually…", 'Когда возникает разногласие, я обычно…'),
    options: [
      opt('talk_now', 'Talk it through right away', 'Сразу всё обсуждаю'),
      opt('cool_down_then_talk', 'Cool down first, then talk', 'Сначала остываю, потом говорю'),
      opt('let_it_go', 'Let it go', 'Отпускаю ситуацию'),
    ],
  },
  {
    key: 'rel_05', instrument: 'ns_custom', version: 1, block: 'B', trait: 'care_language', type: 'multi',
    minSelect: 1, maxSelect: 2,
    prompt: t('I feel most cared for when someone…', 'Я чувствую заботу больше всего, когда человек…'),
    options: [
      opt('words', 'Tells me how they feel', 'Говорит, что чувствует'),
      opt('time', 'Spends real time with me', 'Проводит со мной время'),
      opt('help', 'Helps me out', 'Помогает мне'),
      opt('gifts', 'Surprises me with something small', 'Делает маленькие сюрпризы'),
      opt('touch', 'Is physically affectionate', 'Проявляет нежность через прикосновения'),
    ],
  },
  {
    key: 'rel_06', instrument: 'ns_custom', version: 1, block: 'B', trait: 'affection_expression', type: 'likert5',
    prompt: t('I show affection openly, with words or touch.', 'Я открыто проявляю чувства, словами или прикосновениями.'),
  },

  // Block C: What matters
  {
    key: 'val_01', instrument: 'ns_custom', version: 1, block: 'C', trait: 'values', type: 'multi',
    minSelect: 3, maxSelect: 3,
    prompt: t('Pick your top 3 values', 'Выбери 3 главные ценности'),
    options: [
      opt('family', 'Family', 'Семья'), opt('career', 'Career', 'Карьера'),
      opt('adventure', 'Adventure', 'Приключения'), opt('stability', 'Stability', 'Стабильность'),
      opt('growth', 'Growth', 'Развитие'), opt('creativity', 'Creativity', 'Творчество'),
      opt('health', 'Health', 'Здоровье'), opt('faith', 'Faith', 'Вера'),
      opt('freedom', 'Freedom', 'Свобода'), opt('community', 'Community', 'Сообщество'),
    ],
  },
  {
    key: 'val_02', instrument: 'ns_custom', version: 1, block: 'C', trait: 'kids_plan', type: 'single',
    prompt: t('Kids?', 'Дети?'),
    options: [
      opt('have_want_more', 'Have and want more', 'Есть и хочу ещё'),
      opt('have_no_more', 'Have, no more', 'Есть, больше не хочу'),
      opt('want', 'Want someday', 'Хочу когда-нибудь'),
      opt('dont_want', "Don't want", 'Не хочу'),
      opt('open', 'Open', 'Открыт(а) к этому'),
      opt('not_sure', 'Not sure', 'Пока не знаю'),
    ],
  },
  {
    key: 'val_03', instrument: 'ns_custom', version: 1, block: 'C', trait: 'life_direction', type: 'single',
    prompt: t("In 5 years you'd love to…", 'Через 5 лет тебе хотелось бы…'),
    options: [
      opt('settle_build', 'Settle down and build a home', 'Обустроить дом и семью'),
      opt('grow_career', 'Grow my career', 'Вырасти в карьере'),
      opt('explore_world', 'Explore the world', 'Посмотреть мир'),
      opt('balance_all', 'Balance it all', 'Совмещать всё понемногу'),
    ],
  },

  // Block D: How you live
  {
    key: 'life_01', instrument: 'ns_custom', version: 1, block: 'D', trait: 'weekend_style', type: 'single',
    prompt: t('Your ideal weekend', 'Твои идеальные выходные'),
    options: [
      opt('cozy_home', 'Cozy at home', 'Уютно дома'),
      opt('outdoors_active', 'Outdoors and active', 'Активно на природе'),
      opt('social_out', 'Out with friends', 'С друзьями в городе'),
      opt('culture_explore', 'Culture and exploring', 'Культура и новые места'),
      opt('mix', 'A mix', 'Всего понемногу'),
    ],
  },
  {
    key: 'life_02', instrument: 'ns_custom', version: 1, block: 'D', trait: 'spontaneity', type: 'likert5',
    prompt: t('Plans or spontaneity?', 'Планы или спонтанность?'),
    anchors: { low: t('I plan everything', 'Я всё планирую'), high: t('I decide on the spot', 'Решаю на месте') },
  },
  {
    key: 'life_03', instrument: 'ns_custom', version: 1, block: 'D', trait: 'activity_level', type: 'single',
    prompt: t('How active is your lifestyle?', 'Насколько активный у тебя образ жизни?'),
    options: [
      opt('low', 'Low', 'Спокойный'), opt('moderate', 'Moderate', 'Умеренный'),
      opt('high', 'High', 'Активный'), opt('very_high', 'Very high', 'Очень активный'),
    ],
  },
  {
    key: 'life_04', instrument: 'ns_custom', version: 1, block: 'D', trait: 'smoking', type: 'single',
    prompt: t('Smoking', 'Курение'),
    options: [opt('never', 'Never', 'Никогда'), opt('socially', 'Socially', 'Иногда в компании'), opt('regularly', 'Regularly', 'Регулярно')],
  },
  {
    key: 'life_05', instrument: 'ns_custom', version: 1, block: 'D', trait: 'drinking', type: 'single',
    prompt: t('Drinking', 'Алкоголь'),
    options: [
      opt('never', 'Never', 'Никогда'), opt('rarely', 'Rarely', 'Редко'),
      opt('socially', 'Socially', 'В компании'), opt('often', 'Often', 'Часто'),
    ],
  },
  {
    key: 'com_01', instrument: 'ns_custom', version: 1, block: 'D', trait: 'texting_rhythm', type: 'single',
    prompt: t('When getting to know someone, I like texting…', 'Когда знакомлюсь, мне нравится переписываться…'),
    options: [
      opt('all_day', 'All day', 'Весь день'),
      opt('few_times_day', 'A few times a day', 'Несколько раз в день'),
      opt('daily_checkin', 'A daily check-in', 'Раз в день'),
      opt('prefer_meeting', 'Rather meet than text', 'Лучше встретиться, чем писать'),
    ],
  },
  {
    key: 'com_02', instrument: 'ns_custom', version: 1, block: 'D', trait: 'conversation_depth', type: 'likert5',
    prompt: t('What kind of conversation do you enjoy most?', 'Какие разговоры тебе нравятся больше всего?'),
    anchors: { low: t('Light and playful', 'Лёгкие и игривые'), high: t('Deep and meaningful', 'Глубокие и со смыслом') },
  },

  // Optional: hard no's
  {
    key: 'deal_01', instrument: 'ns_custom', version: 1, block: 'X', trait: 'dealbreakers', type: 'multi',
    minSelect: 0, maxSelect: 3, optional: true,
    prompt: t("Hard no's (optional)", 'Точно нет (необязательно)'),
    options: [
      opt('smoker', 'Smoker', 'Курит'), opt('heavy_drinker', 'Heavy drinker', 'Много пьёт'),
      opt('wants_kids', 'Wants kids', 'Хочет детей'), opt('doesnt_want_kids', "Doesn't want kids", 'Не хочет детей'),
      opt('has_kids', 'Has kids', 'Есть дети'),
    ],
  },
];

export const ITEMS_BY_KEY: ReadonlyMap<string, ItemDef> = new Map(QUICK_SCAN_ITEMS.map((i) => [i.key, i]));

/** Deep Personality items in the shared ItemDef shape (English only until an approved translation exists). */
export const DEEP_ITEM_DEFS: readonly ItemDef[] = DEEP_ITEMS.map((d) => ({
  key: d.key,
  instrument: 'ipip_neo_120',
  version: 1,
  block: `P${d.part}` as ItemBlock,
  trait: d.facet,
  domain: d.domain,
  keyed: d.keyed,
  type: 'likert5',
  prompt: { en: `${d.text}.`, ru: null },
}));

/** Every answerable item (Quick Scan + Deep Personality). */
export const ALL_ITEMS_BY_KEY: ReadonlyMap<string, ItemDef> = new Map([...QUICK_SCAN_ITEMS, ...DEEP_ITEM_DEFS].map((i) => [i.key, i]));

/** Items required for the Quick Scan to count as complete (all non-optional ones). */
export const REQUIRED_QUICK_SCAN_KEYS: readonly string[] = QUICK_SCAN_ITEMS.filter((i) => !i.optional).map((i) => i.key);

/** Positive/reverse item pairs used for the consistency check (ENG-006). */
export const CONSISTENCY_PAIRS: ReadonlyArray<[string, string, MeasuredDomain]> = [
  ['mi_01', 'mi_16', 'E'],
  ['mi_02', 'mi_17', 'A'],
  ['mi_13', 'mi_08', 'C'],
  ['mi_14', 'mi_09', 'N'],
  ['mi_05', 'mi_20', 'O'],
];

/** Validates an answer against its item. Returns an error code or null. */
export function validateAnswer(item: ItemDef, value: unknown): string | null {
  if (value === null) return null; // null = skip
  switch (item.type) {
    case 'likert5':
      return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5 ? null : 'INVALID_LIKERT';
    case 'single':
      return typeof value === 'string' && item.options?.some((o) => o.key === value) ? null : 'INVALID_OPTION';
    case 'multi': {
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) return 'INVALID_MULTI';
      const set = new Set(value as string[]);
      if (set.size !== value.length) return 'DUPLICATE_OPTION';
      if (!(value as string[]).every((v) => item.options?.some((o) => o.key === v))) return 'INVALID_OPTION';
      if (item.minSelect !== undefined && value.length < item.minSelect) return 'TOO_FEW';
      if (item.maxSelect !== undefined && value.length > item.maxSelect) return 'TOO_MANY';
      return null;
    }
  }
}
