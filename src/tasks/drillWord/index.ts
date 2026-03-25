import { shuffle } from '../../arrayUtils';
import { getActiveWords, getWordsForSound } from '../../words';
import type { ResolvedWordEntry } from '../../words';
import type { TaskResult } from '../shared/types';
import type { PhonemeAssessment } from '../shared/types';

export type { TaskResult };

// ---------------------------------------------------------------------------
// Task type
// ---------------------------------------------------------------------------

/** Say a single word aloud. The classic pronunciation drill. */
export interface DrillWordTask {
  type: 'DrillWord';
  word: string;
  illustration: string;
}

// ---------------------------------------------------------------------------
// Evaluator (re-exported from evaluator.ts)
// ---------------------------------------------------------------------------

export { evaluateDrillWord } from './evaluator';
export type { PhonemeAssessment };

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

/** Per-sound shuffled session queues. Refill automatically when exhausted. */
const wordQueues = new Map<string, ResolvedWordEntry[]>();

/**
 * Returns the next word from the queue for the given sound,
 * reshuffling from the appropriate word list when exhausted.
 *
 * @param sound - Sound group key (e.g. 'd', 't'), or undefined for all words.
 */
function pickWord(sound?: string): ResolvedWordEntry {
  const key = sound ?? '';
  if (!wordQueues.has(key) || wordQueues.get(key)!.length === 0) {
    wordQueues.set(key, shuffle(sound ? getWordsForSound(sound) : getActiveWords()));
  }
  return wordQueues.get(key)!.pop()!;
}

/**
 * Picks n DrillWord tasks for a lesson, with no repeated words within the lesson.
 *
 * @param n     - Number of tasks to pick.
 * @param sound - Optional sound group key to restrict words to (e.g. 'd', 't').
 */
export function pickDrillWordLesson(n: number, sound?: string): DrillWordTask[] {
  return Array.from({ length: n }, () => {
    const { word, illustration } = pickWord(sound);
    return { type: 'DrillWord', word, illustration };
  });
}
