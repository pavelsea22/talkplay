import { shuffle } from '../../arrayUtils';
import { getActiveWords } from '../../words';
import { normalizeTranscript } from '../../evaluate';
import type { TaskResult } from '../shared/types';
import { randomPraise } from '../shared/praise';

// ---------------------------------------------------------------------------
// Task type
// ---------------------------------------------------------------------------

/** Say a single word aloud. The classic pronunciation drill. */
export interface DrillWordTask {
  type: 'DrillWord';
  word: string;
  illustration: string;
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluates one attempt at a DrillWord task.
 * Returns outcome: 'passed' on success, null on failure (caller promotes to
 * 'failed' once MAX_RETRIES is reached).
 *
 * @param task        - The DrillWord task being attempted.
 * @param transcript  - Raw text from the speech recognizer.
 * @param retryCount  - Failed attempts before this one (0 = first try).
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

  const screenMessage = !displayHeard
    ? 'No speech detected — try again!'
    : `I heard "${displayHeard}". Try again!`;

  const spokenMessage = !displayHeard
    ? 'No speech detected, try again!'
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

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

// Shuffled session queue. Refills automatically when exhausted.
let wordQueue: ReturnType<typeof getActiveWords> = [];

/** Returns the next word from the session queue, reshuffling when exhausted. */
function pickWord() {
  if (wordQueue.length === 0) wordQueue = shuffle(getActiveWords());
  return wordQueue.pop()!;
}

/**
 * Picks n DrillWord tasks for a lesson, with no repeated words within the lesson.
 */
export function pickDrillWordLesson(n: number): DrillWordTask[] {
  return Array.from({ length: n }, () => {
    const { word, illustration } = pickWord();
    return { type: 'DrillWord', word, illustration };
  });
}
