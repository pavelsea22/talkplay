import { evaluateDrillWord } from './drillWord';
import type { Task, TaskResult } from './types';

/**
 * Dispatches to the correct evaluator based on the task's type.
 * This is the only function App.svelte needs to call — it never
 * has to import or know about individual task variants.
 *
 * @param task        - The task currently being attempted.
 * @param transcript  - Raw text returned by the speech recognizer.
 * @param retryCount  - Number of failed attempts before this one (0 = first try).
 */
export function evaluateTask(
  task: Task,
  transcript: string,
  retryCount: number,
): TaskResult {
  switch (task.type) {
    case 'DrillWord':
      return evaluateDrillWord(task, transcript, retryCount);
    // New task types get a case here. Once the union has 2+ members TypeScript
    // will error at compile time if a variant is unhandled (exhaustiveness check).
    default:
      throw new Error(`Unknown task type: ${(task as { type: string }).type}`);
  }
}

// Re-export the shared types so callers only need one import.
export type { Task, TaskOutcome, TaskResult, TaskStatus, DrillWordTask } from './types';
