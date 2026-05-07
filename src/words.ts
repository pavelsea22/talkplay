import wordData from './words.json';

export interface WordEntry {
  word: string;
  /** Defaults to `images/words/{word}.svg` when omitted. */
  illustration?: string;
}

/** A target/foil pair used in minimal-pair discrimination tasks. */
export interface MinPairEntry {
  target: WordEntry;
  foil: WordEntry;
}

export interface SoundGroup {
  sound: string;
  label: string;
  positions: {
    leading: WordEntry[];
    trailing: WordEntry[];
    "mid-word": WordEntry[];
  };
  minPairs?: MinPairEntry[];
}

export const WORD_GROUPS: SoundGroup[] = wordData as SoundGroup[];

/** A fully resolved word entry with illustration path guaranteed. */
export interface ResolvedWordEntry {
  word: string;
  illustration: string;
}

/**
 * Resolves a WordEntry, filling in the default illustration path when omitted.
 */
function resolveEntry({ word, illustration }: WordEntry): ResolvedWordEntry {
  return { word, illustration: illustration ?? `images/words/${word}.svg` };
}

/**
 * Returns all non-empty WordEntry items across all groups and positions,
 * with `illustration` resolved to its default path when omitted.
 */
export function getActiveWords(): ResolvedWordEntry[] {
  return WORD_GROUPS.flatMap(group =>
    Object.values(group.positions).flat()
  ).map(resolveEntry);
}

/**
 * Returns resolved WordEntry items for a specific sound group.
 * Returns all words when no matching group is found.
 */
export function getWordsForSound(sound: string): ResolvedWordEntry[] {
  const group = WORD_GROUPS.find(g => g.sound === sound);
  if (!group) return getActiveWords();
  return Object.values(group.positions).flat().map(resolveEntry);
}

/** A fully resolved minimal pair with illustration paths guaranteed on both words. */
export interface ResolvedMinPair {
  target: ResolvedWordEntry;
  foil: ResolvedWordEntry;
}

/**
 * Returns all resolved minimal pairs for the given sound, or all sounds when omitted.
 *
 * @param sound - Sound group key (e.g. 't', 'd'), or undefined for all groups.
 */
export function getMinPairsForSound(sound?: string): ResolvedMinPair[] {
  const groups = sound
    ? WORD_GROUPS.filter(g => g.sound === sound)
    : WORD_GROUPS;
  return groups.flatMap(g => g.minPairs ?? []).map(p => ({
    target: resolveEntry(p.target),
    foil:   resolveEntry(p.foil),
  }));
}
