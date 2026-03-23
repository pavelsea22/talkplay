import { shuffle } from '../../arrayUtils';
import { getActiveWords } from '../../words';
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

// Shuffled session queue. Refills automatically when exhausted.
let wordQueue: ReturnType<typeof getActiveWords> = [];

/** Returns the next word from the session queue, reshuffling when exhausted. */
function pickWord() {
  if (wordQueue.length === 0) wordQueue = shuffle(getActiveWords());
  return wordQueue.pop()!;
}

/**
 * Picks n DrillWord tasks for a lesson, with no repeated words within the lesson.
 */
export function pickDrillWordLesson(n: number): DrillWordTask[] {
  return Array.from({ length: n }, () => {
    const { word, illustration } = pickWord();
    return { type: 'DrillWord', word, illustration };
  });
}
