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
import type { DrillWordTask } from './drillWord';
import type { MinPairDiscrimTask } from './minPairDiscrim';

// Re-export shared types so callers need only one import.
export type { TaskOutcome, TaskResult, TaskStatus } from './shared/types';
export type { DrillWordTask } from './drillWord';
export type { MinPairDiscrimTask } from './minPairDiscrim';

/** Union of all concrete task variants. */
export type Task = DrillWordTask | MinPairDiscrimTask;

/**
 * Picks a mixed lesson of n tasks (currently 60 % DrillWord, 40 % MinPair),
 * shuffled so task types aren't always grouped together.
 *
 * @param n     - Total number of tasks in the lesson.
 * @param sound - Optional sound group key to restrict tasks to (e.g. 'd', 't').
 */
export function pickLesson(n: number, sound?: string): Task[] {
  const drillCount    = Math.ceil(n * 0.6);
  const minPairCount  = n - drillCount;
  return shuffle([
    ...pickDrillWordLesson(drillCount, sound),
    ...pickMinPairLesson(minPairCount, sound),
  ]);
}
