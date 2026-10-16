import { keywordRisk } from './soul-content';

describe('Soul Talk keyword safety backup (SOUL-006)', () => {
  it.each([
    ['Honestly some days I want to die', 'self_harm'],
    ['I think about suicide sometimes', 'self_harm'],
    ['Иногда мне кажется, что я не хочу жить', 'self_harm'],
    ['Не хочется жить вообще', 'self_harm'],
    ['думаю покончить с собой', 'self_harm'],
    ['Хочу умереть', 'self_harm'],
    ['мысли о суициде', 'self_harm'],
    ['Муж меня бьёт', 'abuse_or_danger'],
    ['he hits me when he is drunk', 'abuse_or_danger'],
    ['Вообще-то мне 16 лет', 'underage'],
    ["I'm 15 years old", 'underage'],
    ['убью его', 'harm_to_others'],
    ['не могу дышать', 'medical_emergency'],
  ])('flags "%s" as %s', (text, category) => {
    expect(keywordRisk(text)).toBe(category);
  });

  it.each([
    'I love long walks and coffee',
    'Мне 26 лет, люблю походы',
    'Я хочу жить у моря',
    'Это убийственно смешно',
    'I am 25 years old',
  ])('does not flag "%s"', (text) => {
    expect(keywordRisk(text)).toBeNull();
  });
});
