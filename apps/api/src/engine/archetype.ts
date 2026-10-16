/**
 * ENG-007: deterministic Soul Archetype from the strongest "high" domains (PRD appendix B).
 */
import { DOMAINS, type ArchetypeKey, type DimensionResult, type Domain } from './types';

const PAIRS: Record<string, ArchetypeKey> = {
  OC: 'architect',
  OE: 'explorer',
  OA: 'dreamer',
  OS: 'free_spirit',
  CE: 'captain',
  CA: 'guardian',
  CS: 'anchor',
  EA: 'sunshine',
  ES: 'adventurer',
  AS: 'peacemaker',
};

const ORDER: Record<Domain, number> = { O: 0, C: 1, E: 2, A: 3, S: 4 };

export function deriveArchetype(domains: Record<Domain, DimensionResult>): ArchetypeKey {
  const high = DOMAINS.filter((d) => domains[d].band === 'high' && domains[d].score !== null).sort(
    (a, b) => (domains[b].score as number) - (domains[a].score as number) || ORDER[a] - ORDER[b],
  );
  if (high.length === 0) return 'harmonizer';
  if (high.length === 1) return `single_${high[0]}` as ArchetypeKey;
  const pair = [high[0] as Domain, high[1] as Domain].sort((a, b) => ORDER[a] - ORDER[b]).join('');
  return PAIRS[pair] as ArchetypeKey;
}
