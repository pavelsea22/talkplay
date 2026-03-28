import { normalizeTranscript } from '../../evaluate';
import { randomPraise } from '../shared/praise';
import type { TaskResult } from '../shared/types';
import type { PhonemeAssessment } from '../shared/types';
import type { DrillWordTask } from './index';

// ---------------------------------------------------------------------------
// Score thresholds (easy to tune)
// ---------------------------------------------------------------------------

/** Accuracy score at or above which the attempt counts as a pass. */
export const PASS_THRESHOLD = 75;

/** Accuracy score at or above which the attempt gets a retry (below = fail-band, still retried). */
export const RETRY_THRESHOLD = 45;

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluates one attempt at a DrillWord task.
 *
 * When `assessment` is provided, uses Azure accuracyScore to judge the attempt:
 * - ≥ PASS_THRESHOLD  → pass
 * - ≥ RETRY_THRESHOLD → retry (outcome: null)
 * - < RETRY_THRESHOLD → retry (outcome: null); caller promotes to 'failed' at MAX_RETRIES
 *
 * When `assessment` is null, falls back to exact string-match on the transcript.
 *
 * Returns outcome: 'passed' on success, null on failure (caller promotes to
 * 'failed' once MAX_RETRIES is reached).
 *
 * @param task        - The DrillWord task being attempted.
 * @param transcript  - Raw text from the speech recognizer.
 * @param assessment  - Phoneme-level assessment from Azure, or null if unavailable.
 * @param retryCount  - Failed attempts before this one (0 = first try).
 */
export function evaluateDrillWord(
  task: DrillWordTask,
  transcript: string,
  assessment: PhonemeAssessment | null,
  retryCount: number,
): TaskResult {
  const correct = assessment !== null
    ? assessment.accuracyScore >= PASS_THRESHOLD
    : (() => {
        const target = task.word.toLowerCase().replace(/[^a-z]/g, '').trim();
        const heard = normalizeTranscript(transcript);
        return heard.some(w => w === target);
      })();

  if (correct) {
    const praise = randomPraise();
    return {
      outcome: 'passed',
      screenMessage: praise,
      screenClass: 'correct',
      cindyMood: 'happy',
      spoken: praise,
      showNext: true,
    };
  }

  // Build the "I heard…" message from transcript regardless of assessment path.
  const heard = normalizeTranscript(transcript);
  const displayHeard = heard.join(' ').trim();

  const screenMessage = !displayHeard
    ? "I couldn't hear you — try again!"
    : `I heard "${displayHeard}". Try again!`;

  const spokenMessage = !displayHeard
    ? "I couldn't hear you, try again!"
    : `I heard "${displayHeard}", try again!`;

  return {
    outcome: null,
    screenMessage,
    screenClass: 'incorrect',
    cindyMood: retryCount >= 2 ? 'crying' : 'sad',
    spoken: spokenMessage,
    showNext: false,
  };
}
