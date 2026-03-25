import type { WordSortTask } from './types';

/**
 * Evaluates a single word drop into a bucket.
 *
 * @param word - The word being dropped.
 * @param bucketIndex - The bucket index (0 or 1).
 * @param task - The WordSort task definition.
 * @returns 'correct' if the word belongs in that bucket, 'incorrect' otherwise.
 */
export function evaluateWordSort(
  word: string,
  bucketIndex: 0 | 1,
  task: WordSortTask
): 'correct' | 'incorrect' {
  const correctBucketIndex = task.correctBucket[word];
  return correctBucketIndex === bucketIndex ? 'correct' : 'incorrect';
}
