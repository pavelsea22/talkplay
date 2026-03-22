/**
 * Shared types for all task variants.
 *
 * A Task is the atomic unit of a lesson. Each variant has a `type`
 * discriminant and carries the data its evaluator needs. All variants
 * produce a TaskResult when evaluated.
 *
 * Adding a new task type:
 *  1. Define MyNewTask here and add it to the Task union.
 *  2. Create src/tasks/myNewTask.ts with an evaluateMyNewTask() function.
 *  3. Add a case to evaluateTask() in src/tasks/index.ts.
 *  App.svelte needs no changes.
 */

/** Binary outcome of a completed task. */
export type TaskOutcome = 'passed' | 'failed';

/** Per-slot state for the progress bar (pending = not yet attempted). */
export type TaskStatus = 'pending' | 'passed' | 'failed';

/**
 * Everything the UI needs after evaluating a single attempt.
 * Shared across all task types.
 */
export interface TaskResult {
  outcome: TaskOutcome | null;   // null = attempt made but not yet final (retry allowed)
  screenMessage: string;
  screenClass: 'correct' | 'incorrect';
  cindyMood: 'happy' | 'sad' | 'crying';
  spoken: string | null;
  showNext: boolean;
}

// ---------------------------------------------------------------------------
// Task variants (discriminated union)
// ---------------------------------------------------------------------------

/** Say a single word aloud. The classic drill. */
export interface DrillWordTask {
  type: 'DrillWord';
  word: string;
  illustration: string;
}

// Future variants — shapes are illustrative, fill in when implementing:
// export interface DrillSyllableTask   { type: 'DrillSyllable'; syllable: string; ... }
// export interface DrillPhraseTask     { type: 'DrillPhrase'; phrase: string; ... }
// export interface MinPairDiscrimTask  { type: 'MinPairDiscrimination'; wordA: string; wordB: string; ... }

/** Union of all concrete task types. Grows as new variants are added. */
export type Task = DrillWordTask;
