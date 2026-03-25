import type { WordSortTask } from './types';

/**
 * WordSort lesson sets for /d/ vs /t/ discrimination.
 */
export const WORD_SORT_SETS: WordSortTask[] = [
  {
    type: 'wordSort',
    words: ['dog', 'duck', 'ten', 'top'],
    buckets: ['starts with /d/', 'starts with /t/'],
    correctBucket: {
      dog: 0,
      duck: 0,
      ten: 1,
      top: 1,
    },
  },
  {
    type: 'wordSort',
    words: ['dip', 'dime', 'tip', 'time'],
    buckets: ['starts with /d/', 'starts with /t/'],
    correctBucket: {
      dip: 0,
      dime: 0,
      tip: 1,
      time: 1,
    },
  },
  {
    type: 'wordSort',
    words: ['den', 'dot', 'tent', 'talk'],
    buckets: ['starts with /d/', 'starts with /t/'],
    correctBucket: {
      den: 0,
      dot: 0,
      tent: 1,
      talk: 1,
    },
  },
];

/**
 * Pick a random WordSort task from the available sets.
 *
 * @returns A randomly selected WordSort task.
 */
export function pickWordSortLesson(): WordSortTask {
  const set = WORD_SORT_SETS[Math.floor(Math.random() * WORD_SORT_SETS.length)];
  return {
    ...set,
    words: [...set.words].sort(() => Math.random() - 0.5), // shuffle words
  };
}
