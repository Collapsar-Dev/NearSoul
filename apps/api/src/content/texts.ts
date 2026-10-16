/**
 * Founder-reviewable product texts (DRAFT, en + ru). PRD appendix B/C/D, docs/engine/band-texts.md.
 * Positive framing for both ends of every trait (ENG-009); no clinical labels (ENG-016).
 */
import type { ArchetypeKey, Band, Domain } from '../engine';

export type L = { en: string; ru: string };
export type Locale = 'en' | 'ru';
export const tr = (l: L, locale: Locale) => l[locale] ?? l.en;

export const DOMAIN_META: Record<Domain, { name: L; low: L; high: L }> = {
  O: { name: { en: 'Openness', ru: 'Открытость' }, low: { en: 'Grounded', ru: 'Приземлённость' }, high: { en: 'Curious', ru: 'Любознательность' } },
  C: { name: { en: 'Conscientiousness', ru: 'Организованность' }, low: { en: 'Flexible', ru: 'Гибкость' }, high: { en: 'Organized', ru: 'Собранность' } },
  E: { name: { en: 'Extraversion', ru: 'Общительность' }, low: { en: 'Reflective', ru: 'Вдумчивость' }, high: { en: 'Outgoing', ru: 'Общительность' } },
  A: { name: { en: 'Agreeableness', ru: 'Доброжелательность' }, low: { en: 'Direct', ru: 'Прямота' }, high: { en: 'Warm', ru: 'Теплота' } },
  S: { name: { en: 'Emotional stability', ru: 'Эмоциональная устойчивость' }, low: { en: 'Feels deeply', ru: 'Глубоко чувствует' }, high: { en: 'Steady', ru: 'Устойчивость' } },
};

export const BAND_TEXT: Record<Domain, Record<Band, { summary: L; dating: L; headline: L }>> = {
  O: {
    high: {
      summary: { en: 'You love new ideas, places and experiences, and your imagination is always at work.', ru: 'Ты любишь новые идеи, места и впечатления, а воображение у тебя работает без выходных.' },
      dating: { en: 'In dating, you light up when a conversation goes somewhere unexpected.', ru: 'В отношениях ты оживаешь, когда разговор уходит в неожиданную сторону.' },
      headline: { en: 'Curious explorer', ru: 'Любознательный исследователь' },
    },
    balanced: {
      summary: { en: 'You enjoy new things but also value what already works for you.', ru: 'Ты любишь новое, но ценишь и то, что уже работает.' },
      dating: { en: 'You can enjoy both a familiar favourite place and a spontaneous adventure.', ru: 'Тебе подходит и любимое знакомое место, и спонтанное приключение.' },
      headline: { en: 'Open-minded realist', ru: 'Открытый реалист' },
    },
    low: {
      summary: { en: 'You are practical and grounded, and you trust what is real and proven.', ru: 'Ты практичный и приземлённый человек и доверяешь проверенному.' },
      dating: { en: 'You show love through steady, real-life care rather than big abstractions.', ru: 'Ты проявляешь любовь через реальную, надёжную заботу, а не громкие слова.' },
      headline: { en: 'Grounded realist', ru: 'Приземлённый реалист' },
    },
  },
  C: {
    high: {
      summary: { en: 'You like order and follow-through. People can count on you.', ru: 'Ты любишь порядок и доводишь дела до конца. На тебя можно положиться.' },
      dating: { en: 'You show love by keeping your word and planning thoughtful moments.', ru: 'Ты проявляешь любовь тем, что держишь слово и продумываешь приятные моменты.' },
      headline: { en: 'Reliable planner', ru: 'Надёжный планировщик' },
    },
    balanced: {
      summary: { en: 'You can plan when it matters and go with the flow when it doesn’t.', ru: 'Ты умеешь планировать, когда это важно, и плыть по течению, когда нет.' },
      dating: { en: 'You balance reliability with room for surprises.', ru: 'Ты сочетаешь надёжность и место для сюрпризов.' },
      headline: { en: 'Adaptable organizer', ru: 'Гибкий организатор' },
    },
    low: {
      summary: { en: 'You are flexible and spontaneous, and you adapt easily when plans change.', ru: 'Ты гибкий и спонтанный человек и легко подстраиваешься, когда планы меняются.' },
      dating: { en: 'You bring lightness and spontaneity to the people you’re with.', ru: 'Ты приносишь лёгкость и спонтанность в отношения.' },
      headline: { en: 'Free-flowing spirit', ru: 'Свободный дух' },
    },
  },
  E: {
    high: {
      summary: { en: 'You get energy from people and love being in the middle of things.', ru: 'Тебя заряжают люди, и ты любишь быть в гуще событий.' },
      dating: { en: 'You make new people feel welcome and bring energy to a date.', ru: 'С тобой новым людям легко, а на свидании ты приносишь энергию.' },
      headline: { en: 'Social spark', ru: 'Искра компании' },
    },
    balanced: {
      summary: { en: 'You enjoy people and also value your quiet time.', ru: 'Тебе нравятся люди, но и тихое время для себя важно.' },
      dating: { en: 'You’re comfortable both at a lively dinner and a quiet walk.', ru: 'Тебе комфортно и на шумном ужине, и на тихой прогулке.' },
      headline: { en: 'Easy-going connector', ru: 'Лёгкий в общении' },
    },
    low: {
      summary: { en: 'You recharge in calm, one-to-one time and value depth over crowds.', ru: 'Ты восстанавливаешься в спокойствии и наедине и ценишь глубину больше, чем толпу.' },
      dating: { en: 'You shine in real one-to-one conversations.', ru: 'Ты раскрываешься в настоящих разговорах один на один.' },
      headline: { en: 'Thoughtful soul', ru: 'Вдумчивая душа' },
    },
  },
  A: {
    high: {
      summary: { en: 'You are warm and considerate and you feel what others feel.', ru: 'Ты тёплый и внимательный человек и чувствуешь других.' },
      dating: { en: 'You make people feel cared for and understood.', ru: 'Рядом с тобой люди чувствуют заботу и понимание.' },
      headline: { en: 'Warm heart', ru: 'Тёплое сердце' },
    },
    balanced: {
      summary: { en: 'You are kind and fair, and you can also stand your ground.', ru: 'Ты добрый и справедливый, но умеешь отстоять своё.' },
      dating: { en: 'You balance kindness with honesty.', ru: 'Ты сочетаешь доброту и честность.' },
      headline: { en: 'Kind and fair', ru: 'Добрый и справедливый' },
    },
    low: {
      summary: { en: 'You are direct and independent-minded, and you say what you think.', ru: 'Ты прямой и независимый человек и говоришь, что думаешь.' },
      dating: { en: 'People always know where they stand with you.', ru: 'С тобой человек всегда понимает, где он находится.' },
      headline: { en: 'Honest original', ru: 'Честный и самобытный' },
    },
  },
  S: {
    high: {
      summary: { en: 'You tend to stay calm and steady, even when things get bumpy.', ru: 'Ты обычно остаёшься спокойным и устойчивым, даже когда непросто.' },
      dating: { en: 'You’re a calm, reassuring presence for a partner.', ru: 'Для партнёра ты спокойная и надёжная опора.' },
      headline: { en: 'Calm anchor', ru: 'Спокойная опора' },
    },
    balanced: {
      summary: { en: 'You feel things fully and usually find your balance again.', ru: 'Ты проживаешь эмоции полностью и обычно быстро находишь равновесие.' },
      dating: { en: 'You’re emotionally present without being overwhelmed.', ru: 'Ты эмоционально включён, но не теряешь себя.' },
      headline: { en: 'Balanced heart', ru: 'Сбалансированное сердце' },
    },
    low: {
      summary: { en: 'You feel deeply and notice emotional nuances others miss.', ru: 'Ты глубоко чувствуешь и замечаешь эмоциональные оттенки, которые другие пропускают.' },
      dating: { en: 'You bring emotional depth and sensitivity to a relationship.', ru: 'Ты приносишь в отношения эмоциональную глубину и чуткость.' },
      headline: { en: 'Deep feeler', ru: 'Чуткая душа' },
    },
  },
};

export const ARCHETYPES: Record<ArchetypeKey, { name: L; line: L }> = {
  architect: { name: { en: 'The Architect', ru: 'Архитектор' }, line: { en: 'Imaginative and organized: you dream big and build it step by step.', ru: 'Воображение и собранность: ты мечтаешь масштабно и строишь шаг за шагом.' } },
  explorer: { name: { en: 'The Explorer', ru: 'Исследователь' }, line: { en: 'Curious and outgoing: new places, new people, new ideas.', ru: 'Любознательный и общительный: новые места, люди и идеи.' } },
  dreamer: { name: { en: 'The Dreamer', ru: 'Мечтатель' }, line: { en: 'Imaginative and warm: you see the best in people and possibilities.', ru: 'Воображение и теплота: ты видишь лучшее в людях и возможностях.' } },
  free_spirit: { name: { en: 'The Free Spirit', ru: 'Свободный дух' }, line: { en: 'Curious and calm: open to anything, rarely rattled.', ru: 'Любознательный и спокойный: открыт всему и редко теряет равновесие.' } },
  captain: { name: { en: 'The Captain', ru: 'Капитан' }, line: { en: 'Organized and energetic: you make things happen and bring people along.', ru: 'Собранный и энергичный: ты воплощаешь идеи и ведёшь за собой.' } },
  guardian: { name: { en: 'The Guardian', ru: 'Хранитель' }, line: { en: 'Reliable and caring: people know they can count on you.', ru: 'Надёжный и заботливый: на тебя всегда можно положиться.' } },
  anchor: { name: { en: 'The Anchor', ru: 'Якорь' }, line: { en: 'Steady and dependable: a calm, solid presence.', ru: 'Устойчивый и надёжный: спокойная, прочная опора.' } },
  sunshine: { name: { en: 'The Sunshine', ru: 'Солнце' }, line: { en: 'Outgoing and warm: you light up a room and make people feel welcome.', ru: 'Общительный и тёплый: ты освещаешь комнату, и людям рядом хорошо.' } },
  adventurer: { name: { en: 'The Adventurer', ru: 'Искатель приключений' }, line: { en: 'Energetic and steady: up for anything, cool under pressure.', ru: 'Энергичный и устойчивый: готов ко всему и спокоен под давлением.' } },
  peacemaker: { name: { en: 'The Peacemaker', ru: 'Миротворец' }, line: { en: 'Warm and calm: you bring harmony and patience.', ru: 'Тёплый и спокойный: ты приносишь гармонию и терпение.' } },
  single_O: { name: { en: 'The Curious Soul', ru: 'Любознательная душа' }, line: { en: 'Your strongest trait is curiosity.', ru: 'Твоя самая сильная черта — любознательность.' } },
  single_C: { name: { en: 'The Reliable Soul', ru: 'Надёжная душа' }, line: { en: 'Your strongest trait is reliability.', ru: 'Твоя самая сильная черта — надёжность.' } },
  single_E: { name: { en: 'The Social Soul', ru: 'Общительная душа' }, line: { en: 'Your strongest trait is social energy.', ru: 'Твоя самая сильная черта — общительность.' } },
  single_A: { name: { en: 'The Warm Soul', ru: 'Тёплая душа' }, line: { en: 'Your strongest trait is warmth.', ru: 'Твоя самая сильная черта — теплота.' } },
  single_S: { name: { en: 'The Steady Soul', ru: 'Устойчивая душа' }, line: { en: 'Your strongest trait is calm steadiness.', ru: 'Твоя самая сильная черта — спокойная устойчивость.' } },
  harmonizer: { name: { en: 'The Harmonizer', ru: 'Гармонизатор' }, line: { en: 'Balanced across the board: you adapt to people and situations with ease.', ru: 'Во всём баланс: ты легко подстраиваешься под людей и ситуации.' } },
};

export const ARCHETYPE_DISCLAIMER: L = {
  en: 'A friendly summary of your strongest traits, not a box.',
  ru: 'Дружеское описание твоих сильных черт, а не ярлык.',
};

export const STRENGTHS: Record<string, L> = {
  curious: { en: 'Curious', ru: 'Любознательный' }, open_minded: { en: 'Open-minded', ru: 'Открытый' }, grounded: { en: 'Grounded', ru: 'Приземлённый' },
  reliable: { en: 'Reliable', ru: 'Надёжный' }, adaptable: { en: 'Adaptable', ru: 'Гибкий' }, flexible: { en: 'Flexible', ru: 'Лёгкий на подъём' },
  energizing: { en: 'Energizing', ru: 'Заряжающий' }, sociable: { en: 'Sociable', ru: 'Общительный' }, reflective: { en: 'Reflective', ru: 'Вдумчивый' },
  kind: { en: 'Kind', ru: 'Добрый' }, fair: { en: 'Fair', ru: 'Справедливый' }, independent_minded: { en: 'Independent-minded', ru: 'Независимый' },
  steady: { en: 'Steady', ru: 'Устойчивый' }, balanced: { en: 'Balanced', ru: 'Уравновешенный' }, feels_deeply: { en: 'Feels deeply', ru: 'Чуткий' },
};

const VALUE: Record<string, L> = {
  family: { en: 'Family', ru: 'Семья' }, career: { en: 'Career', ru: 'Карьера' }, adventure: { en: 'Adventure', ru: 'Приключения' },
  stability: { en: 'Stability', ru: 'Стабильность' }, growth: { en: 'Growth', ru: 'Развитие' }, creativity: { en: 'Creativity', ru: 'Творчество' },
  health: { en: 'Health', ru: 'Здоровье' }, faith: { en: 'Faith', ru: 'Вера' }, freedom: { en: 'Freedom', ru: 'Свобода' }, community: { en: 'Community', ru: 'Сообщество' },
};
const CARE: Record<string, L> = {
  words: { en: 'kind words', ru: 'тёплые слова' }, time: { en: 'quality time', ru: 'время вместе' }, help: { en: 'helpful acts', ru: 'помощь' },
  gifts: { en: 'small surprises', ru: 'маленькие сюрпризы' }, touch: { en: 'physical affection', ru: 'прикосновения' },
};
const WEEKEND: Record<string, L> = {
  cozy_home: { en: 'cozy at home', ru: 'уютно дома' }, outdoors_active: { en: 'outdoors and active', ru: 'активно на природе' },
  social_out: { en: 'out with friends', ru: 'с друзьями' }, culture_explore: { en: 'exploring culture', ru: 'с культурой и новыми местами' },
};

/** Reason, friction and tip codes → text (PRD appendix C). `{name}` and `{x}` are placeholders. */
const CODES: Record<string, L> = {
  'SHARED_VALUE': { en: '{x} is one of the top values for both of you.', ru: '{x} — одна из главных ценностей для вас обоих.' },
  SAME_LIFE_DIRECTION: { en: 'You picture the next few years in a similar way.', ru: 'Вы похоже видите ближайшие годы.' },
  KIDS_ALIGNED: { en: 'You’re on the same page about kids.', ru: 'Вы одинаково смотрите на вопрос детей.' },
  BOTH_DEEP_TALKERS: { en: 'You both prefer deep conversations over small talk.', ru: 'Вы оба предпочитаете глубокие разговоры светской болтовне.' },
  BOTH_PLAYFUL_TALKERS: { en: 'You both like keeping things light and playful.', ru: 'Вы оба любите лёгкое и игривое общение.' },
  SAME_TEXTING_RHYTHM: { en: 'You like a similar texting rhythm.', ru: 'Вам нравится похожий ритм переписки.' },
  SIMILAR_CLOSENESS: { en: 'You want a similar balance of closeness and space.', ru: 'Вам нужен похожий баланс близости и личного пространства.' },
  SAME_CONFLICT_STYLE: { en: 'You handle disagreements in a similar way.', ru: 'Вы похоже решаете разногласия.' },
  SHARED_CARE_LANGUAGE: { en: 'You both feel cared for through {x}.', ru: 'Вы оба чувствуете заботу через {x}.' },
  SIMILAR_WEEKENDS: { en: 'Your ideal weekends look alike: {x}.', ru: 'Ваши идеальные выходные похожи: {x}.' },
  SIMILAR_PACE: { en: 'You share a similar pace: planned or spontaneous.', ru: 'У вас похожий темп: планы или спонтанность.' },
  SIMILAR_ACTIVITY: { en: 'You have similar activity levels.', ru: 'У вас похожий уровень активности.' },
  BOTH_CURIOUS: { en: 'You’re both curious and open to new experiences.', ru: 'Вы оба любознательны и открыты новому.' },
  BOTH_ORGANIZED: { en: 'You both like order and follow-through.', ru: 'Вы оба цените порядок и доводите дела до конца.' },
  BOTH_WARM: { en: 'You’re both warm and considerate.', ru: 'Вы оба тёплые и внимательные.' },
  BOTH_STEADY: { en: 'You both tend to stay calm and steady.', ru: 'Вы оба обычно спокойны и устойчивы.' },
  SHARED_INTEREST: { en: 'You both enjoy {x}.', ru: 'Вам обоим нравится {x}.' },
  SAME_INTENT: { en: 'You’re looking for the same kind of relationship.', ru: 'Вы ищете одинаковые отношения.' },
  PACE_MISMATCH: { en: 'One of you plans, the other improvises. Agree early on how spontaneous your first date should be.', ru: 'Один из вас планирует, другой импровизирует. Заранее договоритесь, насколько спонтанным будет первое свидание.' },
  CLOSENESS_GAP: { en: 'You may want different amounts of together time. Talk openly about what “enough” feels like.', ru: 'Вам может хотеться разного количества времени вместе. Обсудите, что для каждого «достаточно».' },
  REASSURANCE_SPACE: { en: 'One of you likes frequent check-ins, the other needs space. Small, regular signals can bridge this.', ru: 'Одному важны частые знаки внимания, другому — пространство. Небольшие регулярные сигналы помогут.' },
  CONFLICT_STYLE_GAP: { en: 'One of you wants to talk right away, the other needs time. Agreeing on a “pause, then talk” rule helps.', ru: 'Один хочет обсудить сразу, другому нужно время. Помогает правило «пауза, потом разговор».' },
  TEXTING_GAP: { en: 'You like different texting rhythms. Say what works for you early on.', ru: 'Вам нравится разный ритм переписки. Скажите об этом заранее.' },
  DEPTH_GAP: { en: 'One prefers deep talks, the other light ones. Mix both and see what clicks.', ru: 'Один любит глубокие разговоры, другой лёгкие. Совмещайте и смотрите, что сработает.' },
  SOCIAL_ENERGY_GAP: { en: 'Different social batteries: plan a mix of quiet and social dates.', ru: 'Разная «социальная батарейка»: чередуйте тихие и шумные свидания.' },
  LIFESTYLE_ACTIVITY_GAP: { en: 'Different activity levels. Find a middle ground for dates.', ru: 'Разный уровень активности. Ищите золотую середину для свиданий.' },
  DIFFERENT_DIRECTIONS: { en: 'You picture the next years differently. Worth a curious conversation.', ru: 'Вы по-разному видите ближайшие годы. Стоит об этом спокойно поговорить.' },
  TIP_GIVE_TIME_AFTER_CONFLICT: { en: '{name} usually needs a little time to cool down before talking things through.', ru: '{name} обычно нужно немного времени остыть перед разговором.' },
  TIP_TALK_IT_THROUGH: { en: '{name} prefers to talk things through right away.', ru: '{name} предпочитает обсуждать всё сразу.' },
  TIP_DAILY_CHECKIN: { en: '{name} likes a daily check-in more than constant texting.', ru: '{name} больше нравится переписка раз в день, чем постоянная.' },
  TIP_PREFERS_MEETING: { en: '{name} would rather meet than text for long.', ru: '{name} лучше встретится, чем будет долго переписываться.' },
  TIP_DEEP_QUESTIONS: { en: '{name} enjoys meaningful questions. Skip the small talk.', ru: '{name} любит вопросы со смыслом. Обойдитесь без пустой болтовни.' },
  TIP_KEEP_IT_LIGHT: { en: '{name} enjoys playful, light conversation at first.', ru: '{name} поначалу нравится лёгкое, игривое общение.' },
  TIP_SHOW_CARE: { en: '{name} feels cared for through {x}.', ru: '{name} чувствует заботу через {x}.' },
  TIP_RESPECT_SPACE: { en: '{name} values personal time, even when things are going well.', ru: '{name} ценит личное время, даже когда всё хорошо.' },
  TIP_REASSURE: { en: 'Small signs that you’re interested mean a lot to {name}.', ru: 'Небольшие знаки интереса много значат для {name}.' },
};

/** Renders a code like `SHARED_VALUE:adventure` into localized text. */
export function codeText(code: string, locale: Locale, ctx: { name?: string; interests?: Record<string, L> } = {}): string {
  const [key, arg] = code.split(':') as [string, string | undefined];
  const tpl = CODES[key];
  if (!tpl) return code;
  let x = arg ?? '';
  if (key === 'SHARED_VALUE' && arg) x = tr(VALUE[arg] ?? { en: arg, ru: arg }, locale);
  if ((key === 'SHARED_CARE_LANGUAGE' || key === 'TIP_SHOW_CARE') && arg) x = tr(CARE[arg] ?? { en: arg, ru: arg }, locale);
  if (key === 'SIMILAR_WEEKENDS' && arg) x = tr(WEEKEND[arg] ?? { en: arg, ru: arg }, locale);
  if (key === 'SHARED_INTEREST' && arg) x = ctx.interests?.[arg] ? tr(ctx.interests[arg], locale) : arg;
  return tr(tpl, locale).replace('{x}', x).replace(/\{name\}/g, ctx.name ?? '');
}

export const valueLabel = (v: string, locale: Locale) => tr(VALUE[v] ?? { en: v, ru: v }, locale);
export const careLabel = (v: string, locale: Locale) => tr(CARE[v] ?? { en: v, ru: v }, locale);

export const BANNED_WORDS = ['neurotic', 'unstable', 'lazy', 'cold', 'disorder', 'narciss', 'anxious attachment', 'avoidant', 'mbti', 'невротик', 'нестабильн', 'ленив', 'холодн', 'расстройств'];

/** Self report texts (RPT-001). */
export const SELF_CODES: Record<string, L> = {
  CLOSENESS_HIGH: { en: 'You feel at home in close, interdependent relationships.', ru: 'Тебе комфортно в близких отношениях, где вы опираетесь друг на друга.' },
  CLOSENESS_BALANCED: { en: 'You enjoy closeness and still keep your own footing.', ru: 'Ты ценишь близость, но сохраняешь опору на себя.' },
  CLOSENESS_LOW: { en: 'You open up gradually and value trust that is earned over time.', ru: 'Ты раскрываешься постепенно и ценишь доверие, которое строится со временем.' },
  INDEPENDENCE_HIGH: { en: 'Personal time matters to you, even when things are going well.', ru: 'Личное время для тебя важно, даже когда всё хорошо.' },
  INDEPENDENCE_BALANCED: { en: 'You like a healthy mix of together time and me-time.', ru: 'Тебе нравится баланс времени вместе и времени для себя.' },
  INDEPENDENCE_LOW: { en: 'You love sharing most of your life with a partner.', ru: 'Тебе нравится разделять с партнёром большую часть жизни.' },
  CONFLICT_TALK_NOW: { en: 'In a disagreement, you prefer to talk it through right away.', ru: 'В споре ты предпочитаешь обсуждать всё сразу.' },
  CONFLICT_COOL_DOWN_THEN_TALK: { en: 'In a disagreement, you take a moment to cool down, then talk.', ru: 'В споре ты сначала остываешь, а потом говоришь.' },
  CONFLICT_LET_IT_GO: { en: 'You tend to let small disagreements go.', ru: 'Ты обычно не цепляешься за мелкие разногласия.' },
  GROWTH_CLOSENESS_AND_SPACE: { en: 'You need both reassurance and space. Saying which one you need right now helps a partner a lot.', ru: 'Тебе важны и знаки внимания, и пространство. Говорить, что нужно прямо сейчас, очень помогает партнёру.' },
  GROWTH_SELF_SOOTHING: { en: 'Because you feel deeply, small calming rituals can help you stay grounded in early dating.', ru: 'Ты глубоко чувствуешь, поэтому в начале знакомства помогают небольшие успокаивающие ритуалы.' },
  GROWTH_FOLLOW_THROUGH: { en: 'Confirming plans a day ahead can make your spontaneity feel even more reliable.', ru: 'Подтверждать планы за день — и твоя спонтанность будет ощущаться ещё надёжнее.' },
  GROWTH_SOFT_START: { en: 'Your honesty is a strength; a softer opening line can make it land even better.', ru: 'Твоя честность — сила; мягкое начало разговора помогает ей звучать ещё лучше.' },
};

export const REFLECT_QUESTIONS: L[] = [
  { en: 'When did you last feel truly understood by someone? What made it work?', ru: 'Когда ты в последний раз чувствовал(а), что тебя по-настоящему понимают? Что сработало?' },
  { en: 'What do you need most at the start of something new?', ru: 'Что тебе нужнее всего в начале чего-то нового?' },
  { en: 'Which of your strengths do you want a partner to notice first?', ru: 'Какую из своих сильных сторон ты хочешь, чтобы партнёр заметил первой?' },
];

/** Conversation starters by reason code family (template version of starters_v1). */
export const STARTERS: Record<string, L> = {
  SHARED_VALUE: { en: 'What does {x} mean to you day to day?', ru: 'Что для тебя значит «{x}» в обычной жизни?' },
  SAME_LIFE_DIRECTION: { en: 'Where do you see yourself in a few years, and what excites you most about it?', ru: 'Где ты видишь себя через пару лет и что в этом тебя больше всего радует?' },
  BOTH_DEEP_TALKERS: { en: 'What’s a question you wish people asked you more often?', ru: 'Какой вопрос тебе хотелось бы слышать почаще?' },
  BOTH_PLAYFUL_TALKERS: { en: 'What’s the most random thing that made you laugh this week?', ru: 'Что самое неожиданное рассмешило тебя на этой неделе?' },
  SIMILAR_WEEKENDS: { en: 'What would your perfect Saturday look like this month?', ru: 'Какой была бы твоя идеальная суббота в этом месяце?' },
  SHARED_INTEREST: { en: 'How did you get into {x}?', ru: 'Как ты увлёкся(лась) этим: {x}?' },
  BOTH_CURIOUS: { en: 'What’s something new you’ve been curious about lately?', ru: 'Чем новым ты в последнее время интересуешься?' },
  DEFAULT: { en: 'What made you smile today?', ru: 'Что сегодня заставило тебя улыбнуться?' },
};

export const FIRST_DATE_IDEAS: Record<string, L> = {
  cozy_home: { en: 'A quiet café with board games', ru: 'Тихое кафе с настольными играми' },
  outdoors_active: { en: 'A walk or easy hike with coffee to go', ru: 'Прогулка или лёгкий поход с кофе с собой' },
  social_out: { en: 'A lively bar, then a walk to talk properly', ru: 'Оживлённый бар, а потом прогулка, чтобы спокойно поговорить' },
  culture_explore: { en: 'An exhibition and a coffee afterwards', ru: 'Выставка и кофе после неё' },
  mix: { en: 'Coffee first, then see where the day goes', ru: 'Сначала кофе, а дальше — по настроению' },
  coffee: { en: 'Coffee nearby, right now', ru: 'Кофе рядом, прямо сейчас' },
  walk: { en: 'A short walk around the neighbourhood', ru: 'Короткая прогулка по району' },
  drinks: { en: 'One drink somewhere relaxed', ru: 'Один бокал в спокойном месте' },
  chat: { en: 'A relaxed chat on a bench in the park', ru: 'Спокойный разговор на скамейке в парке' },
};

/** "What you need from a partner" (self report), keyed by tip code family. */
export const NEED_TEXT: Record<string, L> = {
  GIVE_TIME_AFTER_CONFLICT: { en: 'A partner who gives you a little time to cool down before a hard talk.', ru: 'Партнёр, который даёт тебе немного времени остыть перед сложным разговором.' },
  TALK_IT_THROUGH: { en: 'A partner who is willing to talk things through openly.', ru: 'Партнёр, готовый открыто всё обсуждать.' },
  DAILY_CHECKIN: { en: 'A steady daily check-in rather than constant messages.', ru: 'Спокойная переписка раз в день вместо постоянных сообщений.' },
  PREFERS_MEETING: { en: 'Real time together over long text threads.', ru: 'Живые встречи вместо долгих переписок.' },
  DEEP_QUESTIONS: { en: 'Conversations that go beyond small talk.', ru: 'Разговоры глубже, чем светская болтовня.' },
  KEEP_IT_LIGHT: { en: 'Lightness and play, especially at the start.', ru: 'Лёгкость и игра, особенно в начале.' },
  SHOW_CARE: { en: 'Care shown through {x}.', ru: 'Забота через {x}.' },
  RESPECT_SPACE: { en: 'Respect for your personal time.', ru: 'Уважение к твоему личному времени.' },
  REASSURE: { en: 'Small, regular signs of interest.', ru: 'Небольшие регулярные знаки интереса.' },
};

/** Facet names and both positive poles (Deep Personality). N facets are shown inverted (S1–S6), never as clinical labels. */
export const FACET_TEXT: Record<string, { name: L; low: L; high: L }> = {
  O1: { name: { en: 'Imagination', ru: 'Воображение' }, low: { en: 'Down-to-earth', ru: 'Практичность' }, high: { en: 'Dreamy', ru: 'Мечтательность' } },
  O2: { name: { en: 'Love of art', ru: 'Любовь к искусству' }, low: { en: 'Practical tastes', ru: 'Практичный вкус' }, high: { en: 'Art lover', ru: 'Ценитель искусства' } },
  O3: { name: { en: 'Emotional awareness', ru: 'Чуткость к эмоциям' }, low: { en: 'Even-keeled', ru: 'Ровность' }, high: { en: 'Emotionally vivid', ru: 'Яркие эмоции' } },
  O4: { name: { en: 'Adventurousness', ru: 'Тяга к новому' }, low: { en: 'Likes the familiar', ru: 'Любит привычное' }, high: { en: 'Seeks variety', ru: 'Ищет разнообразие' } },
  O5: { name: { en: 'Intellectual curiosity', ru: 'Интеллектуальное любопытство' }, low: { en: 'Hands-on', ru: 'Практик' }, high: { en: 'Loves ideas', ru: 'Любит идеи' } },
  C1: { name: { en: 'Self-efficacy', ru: 'Уверенность в делах' }, low: { en: 'Still learning', ru: 'В процессе роста' }, high: { en: 'Capable', ru: 'Справляется' } },
  C2: { name: { en: 'Orderliness', ru: 'Порядок' }, low: { en: 'Relaxed about mess', ru: 'Спокоен к беспорядку' }, high: { en: 'Tidy', ru: 'Аккуратность' } },
  C3: { name: { en: 'Sense of duty', ru: 'Ответственность' }, low: { en: 'Flexible with rules', ru: 'Гибкость с правилами' }, high: { en: 'Keeps promises', ru: 'Держит слово' } },
  C4: { name: { en: 'Drive', ru: 'Целеустремлённость' }, low: { en: 'Content', ru: 'Удовлетворённость' }, high: { en: 'Ambitious', ru: 'Амбициозность' } },
  C5: { name: { en: 'Self-discipline', ru: 'Самодисциплина' }, low: { en: 'Goes with the flow', ru: 'Плывёт по течению' }, high: { en: 'Follows through', ru: 'Доводит до конца' } },
  C6: { name: { en: 'Thoughtfulness', ru: 'Обдуманность' }, low: { en: 'Spontaneous', ru: 'Спонтанность' }, high: { en: 'Careful', ru: 'Осмотрительность' } },
  E1: { name: { en: 'Friendliness', ru: 'Дружелюбие' }, low: { en: 'Reserved', ru: 'Сдержанность' }, high: { en: 'Warm with people', ru: 'Тепло с людьми' } },
  E2: { name: { en: 'Love of company', ru: 'Любовь к компаниям' }, low: { en: 'Small circles', ru: 'Узкий круг' }, high: { en: 'Big gatherings', ru: 'Большие компании' } },
  E3: { name: { en: 'Assertiveness', ru: 'Напористость' }, low: { en: 'Easy-going', ru: 'Покладистость' }, high: { en: 'Takes the lead', ru: 'Берёт инициативу' } },
  E4: { name: { en: 'Pace of life', ru: 'Темп жизни' }, low: { en: 'Unhurried', ru: 'Неспешность' }, high: { en: 'Always on the go', ru: 'Всегда в движении' } },
  E5: { name: { en: 'Thrill seeking', ru: 'Жажда острых ощущений' }, low: { en: 'Calm pleasures', ru: 'Спокойные радости' }, high: { en: 'Adventure lover', ru: 'Любитель приключений' } },
  E6: { name: { en: 'Cheerfulness', ru: 'Жизнерадостность' }, low: { en: 'Serious', ru: 'Серьёзность' }, high: { en: 'Joyful', ru: 'Радостность' } },
  A1: { name: { en: 'Trust', ru: 'Доверие' }, low: { en: 'Cautious with trust', ru: 'Осторожность в доверии' }, high: { en: 'Trusting', ru: 'Доверчивость' } },
  A2: { name: { en: 'Straightforwardness', ru: 'Прямота' }, low: { en: 'Strategic', ru: 'Стратегичность' }, high: { en: 'Fair and honest', ru: 'Честность' } },
  A3: { name: { en: 'Helpfulness', ru: 'Отзывчивость' }, low: { en: 'Focused on own path', ru: 'Сфокусированность на своём' }, high: { en: 'Generous', ru: 'Щедрость' } },
  A4: { name: { en: 'Cooperation', ru: 'Сотрудничество' }, low: { en: 'Stands ground', ru: 'Отстаивает своё' }, high: { en: 'Peace-keeping', ru: 'Миролюбие' } },
  A5: { name: { en: 'Modesty', ru: 'Скромность' }, low: { en: 'Self-assured', ru: 'Уверенность в себе' }, high: { en: 'Humble', ru: 'Скромный' } },
  A6: { name: { en: 'Compassion', ru: 'Сострадание' }, low: { en: 'Clear-headed', ru: 'Трезвый взгляд' }, high: { en: 'Tender-hearted', ru: 'Мягкое сердце' } },
  S1: { name: { en: 'Calm', ru: 'Спокойствие' }, low: { en: 'Thinks ahead about risks', ru: 'Заранее думает о рисках' }, high: { en: 'Rarely worried', ru: 'Редко тревожится' } },
  S2: { name: { en: 'Even temper', ru: 'Ровный характер' }, low: { en: 'Passionate', ru: 'Горячность' }, high: { en: 'Slow to anger', ru: 'Редко злится' } },
  S3: { name: { en: 'Steady mood', ru: 'Устойчивое настроение' }, low: { en: 'Deeply reflective', ru: 'Глубоко переживает' }, high: { en: 'Upbeat', ru: 'Бодрость духа' } },
  S4: { name: { en: 'Social ease', ru: 'Лёгкость в общении' }, low: { en: 'Takes time to open up', ru: 'Раскрывается постепенно' }, high: { en: 'At ease with new people', ru: 'Легко с новыми людьми' } },
  S5: { name: { en: 'Self-control', ru: 'Самоконтроль' }, low: { en: 'Enjoys indulging', ru: 'Любит себя баловать' }, high: { en: 'Resists temptation', ru: 'Устойчив к соблазнам' } },
  S6: { name: { en: 'Resilience', ru: 'Стрессоустойчивость' }, low: { en: 'Feels pressure strongly', ru: 'Остро чувствует давление' }, high: { en: 'Cool under pressure', ru: 'Спокойствие под давлением' } },
};

export const FACET_DOMAIN: Record<string, 'O' | 'C' | 'E' | 'A' | 'S'> = Object.fromEntries(
  Object.keys(FACET_TEXT).map((k) => [k, k[0] as 'O' | 'C' | 'E' | 'A' | 'S']),
);
