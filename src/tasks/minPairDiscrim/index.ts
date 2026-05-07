import { shuffle } from '../../arrayUtils';
import { getMinPairsForSound } from '../../words';
import type { ResolvedWordEntry, ResolvedMinPair } from '../../words';
import type { TaskResult } from '../shared/types';
import { randomPraise } from '../shared/praise';

// ---------------------------------------------------------------------------
// Task type
// ---------------------------------------------------------------------------

/**
 * User hears one word spoken aloud and must click the matching card.
 * targetWord indicates which of the two cards ('A' or 'B') was spoken.
 */
export interface MinPairDiscrimTask {
  type: 'MinPairDiscrimination';
  wordA: ResolvedWordEntry;
  wordB: ResolvedWordEntry;
  /** Which card contains the spoken word. Randomly assigned at lesson pick time. */
  targetWord: 'A' | 'B';
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluates one click attempt.
 * Returns outcome: 'passed' on correct choice, null on wrong (caller promotes
 * to 'failed' once MAX_RETRIES is reached, same convention as DrillWord).
 *
 * @param task       - The MinPairDiscrim task being attempted.
 * @param chosen     - Which card the user clicked.
 * @param retryCount - Failed attempts before this one (0 = first try).
 */
export function evaluateMinPairDiscrim(
  task: MinPairDiscrimTask,
  chosen: 'A' | 'B',
  retryCount: number,
): TaskResult {
  const correct = chosen === task.targetWord;

  if (correct) {
    const praise = randomPraise();
    return {
      outcome: 'passed',
      screenMessage: praise,
      screenClass: 'correct',
      cindyMood: 'happy',
      spoken: praise,
      showNext: false,
    };
  }

  const targetWordStr = task.targetWord === 'A' ? task.wordA.word : task.wordB.word;

  return {
    outcome: null,
    screenMessage: 'Not quite — listen again!',
    screenClass: 'incorrect',
    cindyMood: retryCount >= 1 ? 'crying' : 'sad',
    spoken: retryCount >= 1
      ? `The word was ${targetWordStr}. Try again!`
      : 'Try again!',
    showNext: false,
  };
}

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

/** Per-sound shuffled pair queues. Refill automatically when exhausted. */
const pairQueues = new Map<string, ResolvedMinPair[]>();

/**
 * Returns the next pair from the queue for the given sound,
 * reshuffling from words.json when exhausted.
 *
 * @param sound - Sound group key (e.g. 'd', 't'), or undefined for all pairs.
 */
function pickPair(sound?: string): ResolvedMinPair {
  const key = sound ?? '';
  if (!pairQueues.has(key) || pairQueues.get(key)!.length === 0) {
    pairQueues.set(key, shuffle(getMinPairsForSound(sound)));
  }
  return pairQueues.get(key)!.pop()!;
}

/**
 * Picks n MinPairDiscrim tasks, randomly assigning which word is spoken
 * in each task so the user can't rely on position.
 *
 * @param n     - Number of tasks to pick.
 * @param sound - Optional sound group key to restrict pairs to (e.g. 'd', 't').
 */
export function pickMinPairLesson(n: number, sound?: string): MinPairDiscrimTask[] {
  return Array.from({ length: n }, () => {
    const { target, foil } = pickPair(sound);
    return {
      type: 'MinPairDiscrimination',
      wordA: target,
      wordB: foil,
      targetWord: Math.random() < 0.5 ? 'A' : 'B',
    };
  });
}
