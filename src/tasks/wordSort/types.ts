import type { TaskResult } from '../shared/types';

/**
 * WordSort task — user drags 4 words into 2 labeled buckets.
 */
export interface WordSortTask {
  type: 'wordSort';
  /** Exactly 4 words to sort. */
  words: string[];
  /** Labels for the two buckets, e.g. ["starts with /d/", "starts with /t/"]. */
  buckets: [string, string];
  /** Maps each word to the index (0 or 1) of its correct bucket. */
  correctBucket: Record<string, 0 | 1>;
}

/**
 * Result for a completed WordSort task.
 */
export interface WordSortResult extends TaskResult {
  type: 'wordSort';
  correct: true; // WordSort only completes on success
}
