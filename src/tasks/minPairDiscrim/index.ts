import { shuffle } from '../../arrayUtils';
import type { TaskResult } from '../shared/types';

// ---------------------------------------------------------------------------
// Task type
// ---------------------------------------------------------------------------

interface WordRef {
  word: string;
  illustration: string;
}

/**
 * User hears one word spoken aloud and must click the matching card.
 * targetWord indicates which of the two cards ('A' or 'B') was spoken.
 */
export interface MinPairDiscrimTask {
  type: 'MinPairDiscrimination';
  wordA: WordRef;
  wordB: WordRef;
  /** Which card contains the spoken word. Randomly assigned at lesson pick time. */
  targetWord: 'A' | 'B';
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluates one click attempt.
 * Returns outcome: 'passed' on correct choice, null on wrong (caller promotes
 * to 'failed' once MAX_RETRIES is reached, same convention as DrillWord).
 *
 * @param task       - The MinPairDiscrim task being attempted.
 * @param chosen     - Which card the user clicked.
 * @param retryCount - Failed attempts before this one (0 = first try).
 */
export function evaluateMinPairDiscrim(
  task: MinPairDiscrimTask,
  chosen: 'A' | 'B',
  retryCount: number,
): TaskResult {
  const correct = chosen === task.targetWord;

  if (correct) {
    return {
      outcome: 'passed',
      screenMessage: 'Correct!',
      screenClass: 'correct',
      cindyMood: 'happy',
      spoken: 'Great job!',
      showNext: false,
    };
  }

  const targetWordStr = task.targetWord === 'A' ? task.wordA.word : task.wordB.word;

  return {
    outcome: null,
    screenMessage: 'Not quite — listen again!',
    screenClass: 'incorrect',
    cindyMood: retryCount >= 1 ? 'crying' : 'sad',
    spoken: retryCount >= 1
      ? `The word was ${targetWordStr}. Try again!`
      : 'Try again!',
    showNext: false,
  };
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface MinPair {
  wordA: WordRef;
  wordB: WordRef;
}

/**
 * Minimal pairs contrasting /t/ with neighbouring consonants.
 * Words marked with (?) need illustration SVGs added to public/images/words/.
 */
const MIN_PAIRS: MinPair[] = [
  { wordA: { word: 'tea',  illustration: 'images/words/tea.svg'  },
    wordB: { word: 'key',  illustration: 'images/words/key.svg'  } },  // (?) key
  { wordA: { word: 'ten',  illustration: 'images/words/ten.svg'  },
    wordB: { word: 'hen',  illustration: 'images/words/hen.svg'  } },  // (?) hen
  { wordA: { word: 'tip',  illustration: 'images/words/tip.svg'  },
    wordB: { word: 'dip',  illustration: 'images/words/dip.svg'  } },  // (?) dip
  { wordA: { word: 'top',  illustration: 'images/words/top.svg'  },
    wordB: { word: 'hop',  illustration: 'images/words/hop.svg'  } },  // (?) hop
  { wordA: { word: 'time', illustration: 'images/words/time.svg' },
    wordB: { word: 'dime', illustration: 'images/words/dime.svg' } },  // (?) dime
];

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

let pairQueue: MinPair[] = [];

function pickPair(): MinPair {
  if (pairQueue.length === 0) pairQueue = shuffle([...MIN_PAIRS]);
  return pairQueue.pop()!;
}

/**
 * Picks n MinPairDiscrim tasks, randomly assigning which word is spoken
 * in each task so the user can't rely on position.
 */
export function pickMinPairLesson(n: number): MinPairDiscrimTask[] {
  return Array.from({ length: n }, () => {
    const pair = pickPair();
    return {
      type: 'MinPairDiscrimination',
      wordA: pair.wordA,
      wordB: pair.wordB,
      targetWord: Math.random() < 0.5 ? 'A' : 'B',
    };
  });
}
