import { normalizeTranscript } from '../evaluate';
import type { DrillWordTask, TaskResult } from './types';

/**
 * Evaluates one attempt at a DrillWord task.
 *
 * Accepts the answer if any word in the transcript matches the target,
 * allowing repeated words ("three three") and numeral variants ("3").
 *
 * @param task        - The DrillWord task being attempted.
 * @param transcript  - Raw text returned by the speech recognizer.
 * @param retryCount  - Number of failed attempts before this one (0 = first try).
 * @returns A {@link TaskResult} describing what to show, say, and whether the task is done.
 */
export function evaluateDrillWord(
  task: DrillWordTask,
  transcript: string,
  retryCount: number,
): TaskResult {
  const target = task.word.toLowerCase().replace(/[^a-z]/g, '').trim();
  const heard = normalizeTranscript(transcript);
  const correct = heard.some(w => w === target);
  const displayHeard = heard.join(' ').trim();

  if (correct) {
    return {
      outcome: 'passed',
      screenMessage: 'You got it!',
      screenClass: 'correct',
      cindyMood: 'happy',
      spoken: 'You got it!',
      showNext: true,
    };
  }

  const screenMessage = !displayHeard
    ? 'No speech detected — try again!'
    : `I heard "${displayHeard}". Try again!`;

  const spokenMessage = !displayHeard
    ? 'No speech detected, try again!'
    : `I heard "${displayHeard}", try again!`;

  return {
    outcome: null,  // still retrying; caller promotes to 'failed' after MAX_RETRIES
    screenMessage,
    screenClass: 'incorrect',
    cindyMood: retryCount >= 2 ? 'crying' : 'sad',
    spoken: spokenMessage,
    showNext: false,
  };
}
