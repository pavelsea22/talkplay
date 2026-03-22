/**
 * Types shared by all task variants.
 * Nothing task-specific lives here — only the contracts that cross task boundaries.
 */

/** Binary outcome of a completed task. */
export type TaskOutcome = 'passed' | 'failed';

/** Per-slot state for the lesson progress bar. */
export type TaskStatus = 'pending' | 'passed' | 'failed';

/**
 * Everything the UI needs after a single evaluation attempt.
 * Each task's evaluator returns one of these; unused fields may be null/empty.
 */
export interface TaskResult {
  /** null = incorrect but retries remain; non-null = task is finished. */
  outcome: TaskOutcome | null;
  screenMessage: string;
  screenClass: 'correct' | 'incorrect';
  cindyMood: 'happy' | 'sad' | 'crying';
  /** Text to pass to TTS. */
  spoken: string | null;
  showNext: boolean;
}
