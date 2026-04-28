/**
 * Public API for the tasks system.
 *
 * Adding a new task type:
 *  1. Create src/tasks/myType/ with index.ts (type + evaluator + picker)
 *     and Activity.svelte (full interaction UI).
 *  2. Add the new type to the Task union below.
 *  3. Add a branch in App.svelte's template to render the new Activity.
 *  4. Optionally include tasks from the new picker in pickLesson().
 */

import { shuffle } from '../arrayUtils';
import { pickDrillWordLesson } from './drillWord';
import { pickMinPairLesson } from './minPairDiscrim';
import { pickWordSortLesson } from './wordSort';
import type { DrillWordTask } from './drillWord';
import type { MinPairDiscrimTask } from './minPairDiscrim';
import type { WordSortTask } from './wordSort';

// Re-export shared types so callers need only one import.
export type { TaskOutcome, TaskResult, TaskStatus } from './shared/types';
export type { DrillWordTask } from './drillWord';
export type { MinPairDiscrimTask } from './minPairDiscrim';
export type { WordSortTask } from './wordSort';

/** Union of all concrete task variants. */
export type Task = DrillWordTask | MinPairDiscrimTask | WordSortTask;

/**
 * Picks a mixed lesson of n tasks (currently 50% DrillWord, 30% MinPair, 20% WordSort),
 * shuffled so task types aren't always grouped together.
 *
 * @param n     - Total number of tasks in the lesson.
 * @param sound - Optional sound group key to restrict tasks to (e.g. 'd', 't').
 */
export function pickLesson(n: number, sound?: string): Task[] {
  const drillCount    = Math.ceil(n * 0.5);
  const minPairCount  = Math.ceil(n * 0.3);
  const wordSortCount = n - drillCount - minPairCount;
  return shuffle([
    ...pickDrillWordLesson(drillCount, sound),
    ...pickMinPairLesson(minPairCount, sound),
    ...Array.from({ length: wordSortCount }, () => pickWordSortLesson()),
  ]);
}

/**
 * Picks a mixed lesson of n tasks distributed evenly across the given sounds.
 * The leftover (when n doesn't divide evenly) goes to the first sounds in the
 * list. Result is shuffled so task types and sounds are interleaved.
 *
 * @param n      - Total number of tasks in the lesson.
 * @param sounds - Sound group keys to draw from. Empty falls back to all sounds.
 */
export function pickLessonForSounds(n: number, sounds: string[]): Task[] {
  if (sounds.length === 0) return pickLesson(n);
  const base = Math.floor(n / sounds.length);
  const remainder = n - base * sounds.length;
  const tasks: Task[] = [];
  sounds.forEach((sound, i) => {
    const count = base + (i < remainder ? 1 : 0);
    if (count > 0) tasks.push(...pickLesson(count, sound));
  });
  return shuffle(tasks);
}
