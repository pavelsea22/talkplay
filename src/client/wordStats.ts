import type { PhonemeAssessment } from '../tasks/shared/types';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const WORD_STATS_KEY    = 'talkplay_word_stats';
const PHONEME_STATS_KEY = 'talkplay_phoneme_stats';

// ---------------------------------------------------------------------------
// EMA tuning
// ---------------------------------------------------------------------------

/** Weight given to each new observation (30% new, 70% history). */
export const EMA_ALPHA = 0.3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Rolling EMA score for a single word.
 * Extensible: a `history` array will be added here for trend charts later.
 */
export interface WordStat {
  /** Exponential moving average of `accuracyScore`, 0–100. */
  ema: number;
  /** Total number of scored attempts recorded. */
  count: number;
}

/**
 * Rolling EMA score for a single IPA phoneme.
 * Mirrors WordStat so both can be displayed and queried the same way.
 */
export interface PhonemeStat {
  /** Exponential moving average of per-phoneme `accuracyScore`, 0–100. */
  ema: number;
  /** Total number of observations recorded for this phoneme. */
  count: number;
}

/** Map of word → WordStat, persisted to localStorage. */
export type WordStatsStore    = Record<string, WordStat>;

/** Map of IPA phoneme → PhonemeStat, persisted to localStorage. */
export type PhonemeStatsStore = Record<string, PhonemeStat>;

// ---------------------------------------------------------------------------
// Internal EMA helpers
// ---------------------------------------------------------------------------

/** Returns a new EMA given the previous state and a fresh observation. */
function updateEma(prev: { ema: number; count: number }, score: number): { ema: number; count: number } {
  const ema   = prev.count === 0 ? score : prev.ema * (1 - EMA_ALPHA) + score * EMA_ALPHA;
  const count = prev.count + 1;
  return { ema, count };
}

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

/**
 * Returns the stored word stats map, or an empty object when nothing has been
 * recorded yet or the stored value is corrupt.
 */
export function getWordStats(): WordStatsStore {
  try {
    const raw = localStorage.getItem(WORD_STATS_KEY);
    return raw ? (JSON.parse(raw) as WordStatsStore) : {};
  } catch {
    return {};
  }
}

/**
 * Returns the stored phoneme stats map, or an empty object when nothing has been
 * recorded yet or the stored value is corrupt.
 */
export function getPhonemeStats(): PhonemeStatsStore {
  try {
    const raw = localStorage.getItem(PHONEME_STATS_KEY);
    return raw ? (JSON.parse(raw) as PhonemeStatsStore) : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

/**
 * Records one scored attempt for `word`, updating both the word-level and
 * per-phoneme EMAs in localStorage.
 *
 * Safe to call on every attempt — pass or fail — as long as `assessment` is
 * non-null. The caller is responsible for not recording attempts where no
 * assessment was returned by the API.
 *
 * @param word        - The target word that was attempted (case-insensitive; stored lowercased).
 * @param assessment  - Phoneme-level assessment returned by Azure.
 */
export function recordAttempt(word: string, assessment: PhonemeAssessment): void {
  const key = word.toLowerCase();

  // --- Word-level EMA ---
  const wordStore = getWordStats();
  wordStore[key]  = updateEma(wordStore[key] ?? { ema: 0, count: 0 }, assessment.accuracyScore);
  localStorage.setItem(WORD_STATS_KEY, JSON.stringify(wordStore));

  // --- Phoneme-level EMA ---
  const phonemeStore = getPhonemeStats();
  for (const { phoneme, accuracyScore } of assessment.phonemes) {
    phonemeStore[phoneme] = updateEma(phonemeStore[phoneme] ?? { ema: 0, count: 0 }, accuracyScore);
  }
  localStorage.setItem(PHONEME_STATS_KEY, JSON.stringify(phonemeStore));
}
