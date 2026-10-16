import { compatibility } from '../compatibility';
import { eligibility } from '../eligibility';
import { scoreProfile } from '../scoring';
import { GOLDEN_PAIRS, PERSONAS, personaAnswers } from './personas';

const byKey = new Map(PERSONAS.map((p) => [p.key, p]));
const subject = (key: string) => {
  const p = byKey.get(key)!;
  return { persona: p, profile: scoreProfile(personaAnswers(p)) };
};

export function goldenResults() {
  return GOLDEN_PAIRS.map(([a, b]) => {
    const A = subject(a);
    const B = subject(b);
    const r = compatibility({ profile: A.profile, intent: A.persona.intent, interests: A.persona.interests }, { profile: B.profile, intent: B.persona.intent, interests: B.persona.interests });
    const base = { status: 'active' as const, ageGatePassed: true, onboardingComplete: true, quickScanComplete: true, photoCount: 2, discoveryEnabled: true, openToMeet: false, hiddenByModeration: false, gender: 'woman' as const, interestedIn: ['woman' as const, 'man' as const, 'non_binary' as const], age: 30, ageMin: 18, ageMax: 99 };
    const e = eligibility(
      { ...base, id: a, intent: A.persona.intent, dealbreakers: A.profile.dealbreakers, smoking: A.profile.lifestyle.smoking.value, drinking: A.profile.lifestyle.drinking.value, kidsPlan: A.profile.values.kids_plan.value },
      { ...base, id: b, intent: B.persona.intent, dealbreakers: B.profile.dealbreakers, smoking: B.profile.lifestyle.smoking.value, drinking: B.profile.lifestyle.drinking.value, kidsPlan: B.profile.values.kids_plan.value },
      { mode: 'daily', blockedEitherWay: false, previouslyMatched: false, passedRecently: false },
    );
    return { pair: `${a}+${b}`, eligible: e.eligible ? true : e.reason, score: r.score, tier: r.tier, archetypes: `${A.profile.archetype}/${B.profile.archetype}`, reasons: r.reasons.slice(0, 4), frictions: r.frictions.slice(0, 3) };
  });
}

