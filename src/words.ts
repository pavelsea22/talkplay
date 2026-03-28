import wordData from './words.json';

export interface WordEntry {
  word: string;
  /** Defaults to `images/words/{word}.svg` when omitted. */
  illustration?: string;
}

export interface SoundGroup {
  sound: string;
  label: string;
  positions: {
    leading: WordEntry[];
    trailing: WordEntry[];
    "mid-word": WordEntry[];
  };
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
