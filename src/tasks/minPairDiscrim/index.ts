import { shuffle } from '../../arrayUtils';
import type { TaskResult } from '../shared/types';

// ---------------------------------------------------------------------------
// Task type
// ---------------------------------------------------------------------------

interface WordRef {
  word: string;
  /** Resolved illustration path, always populated by the picker. */
  illustration: string;
}

/**
 * Compact form used in the raw data table.
 * `illustration` may be omitted when the image filename matches `{word}.svg`.
 */
interface WordEntry {
  word: string;
  illustration?: string;
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
  wordA: WordEntry;
  wordB: WordEntry;
}

/**
 * Resolves a WordEntry into a fully-populated WordRef.
 * Falls back to `images/words/{word}.svg` when no illustration is specified.
 */
function resolveWord(entry: WordEntry): WordRef {
  return {
    word: entry.word,
    illustration: entry.illustration ?? `images/words/${entry.word}.svg`,
  };
}

/**
 * Minimal pairs contrasting /t/ with neighbouring consonants.
 * `illustration` is omitted when the image filename matches `{word}.svg`;
 * missing SVGs are hidden gracefully by the Activity's onerror handler.
 */
const MIN_PAIRS: MinPair[] = [
  // ── Leading /t/ — initial-consonant contrast ──────────────────────────────
  { wordA: { word: 'tea'  }, wordB: { word: 'sea'  } },  // t/s
  { wordA: { word: 'tea'  }, wordB: { word: 'pea'  } },  // t/p
  { wordA: { word: 'tea'  }, wordB: { word: 'bee'  } },  // t/b
  { wordA: { word: 'tea'  }, wordB: { word: 'key'  } },  // t/k
  { wordA: { word: 'top'  }, wordB: { word: 'hop'  } },  // t/h
  { wordA: { word: 'top'  }, wordB: { word: 'mop'  } },  // t/m
  { wordA: { word: 'top'  }, wordB: { word: 'pop'  } },  // t/p
  { wordA: { word: 'tap'  }, wordB: { word: 'cap'  } },  // t/k
  { wordA: { word: 'tap'  }, wordB: { word: 'map'  } },  // t/m
  { wordA: { word: 'tail' }, wordB: { word: 'nail' } },  // t/n
  { wordA: { word: 'tail' }, wordB: { word: 'sail' } },  // t/s
  { wordA: { word: 'tail' }, wordB: { word: 'mail' } },  // t/m
  { wordA: { word: 'ten'  }, wordB: { word: 'hen'  } },  // t/h
  { wordA: { word: 'ten'  }, wordB: { word: 'pen'  } },  // t/p
  { wordA: { word: 'tie'  }, wordB: { word: 'pie'  } },  // t/p
  { wordA: { word: 'toad' }, wordB: { word: 'road' } },  // t/r
  { wordA: { word: 'toy'  }, wordB: { word: 'boy'  } },  // t/b
  { wordA: { word: 'tall' }, wordB: { word: 'ball' } },  // t/b
  { wordA: { word: 'tank' }, wordB: { word: 'bank' } },  // t/b
  { wordA: { word: 'tire' }, wordB: { word: 'fire' } },  // t/f
  { wordA: { word: 'tip'  }, wordB: { word: 'dip'  } },  // t/d
  { wordA: { word: 'time' }, wordB: { word: 'dime' } },  // t/d

  // ── Trailing /t/ — final-consonant contrast ────────────────────────────────
  { wordA: { word: 'cat'  }, wordB: { word: 'cap'  } },  // t/p
  { wordA: { word: 'cat'  }, wordB: { word: 'cab'  } },  // t/b
  { wordA: { word: 'bat'  }, wordB: { word: 'bag'  } },  // t/g
  { wordA: { word: 'hat'  }, wordB: { word: 'ham'  } },  // t/m
  { wordA: { word: 'mat'  }, wordB: { word: 'map'  } },  // t/p
  { wordA: { word: 'hot'  }, wordB: { word: 'hop'  } },  // t/p
  { wordA: { word: 'hot'  }, wordB: { word: 'hog'  } },  // t/g
  { wordA: { word: 'pot'  }, wordB: { word: 'pop'  } },  // t/p
  { wordA: { word: 'dot'  }, wordB: { word: 'dog'  } },  // t/g
  { wordA: { word: 'bit'  }, wordB: { word: 'big'  } },  // t/g
  { wordA: { word: 'bit'  }, wordB: { word: 'bin'  } },  // t/n
  { wordA: { word: 'sit'  }, wordB: { word: 'sip'  } },  // t/p
  { wordA: { word: 'hit'  }, wordB: { word: 'hip'  } },  // t/p
  { wordA: { word: 'cut'  }, wordB: { word: 'cup'  } },  // t/p
  { wordA: { word: 'cut'  }, wordB: { word: 'cub'  } },  // t/b
  { wordA: { word: 'nut'  }, wordB: { word: 'nun'  } },  // t/n
  { wordA: { word: 'hut'  }, wordB: { word: 'hug'  } },  // t/g
  { wordA: { word: 'boot' }, wordB: { word: 'book' } },  // t/k
  { wordA: { word: 'beat' }, wordB: { word: 'bead' } },  // t/d
  { wordA: { word: 'boat' }, wordB: { word: 'bone' } },  // t/n
  { wordA: { word: 'night'}, wordB: { word: 'nine' } },  // t/n
  { wordA: { word: 'bite' }, wordB: { word: 'bike' } },  // t/k
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
      wordA: resolveWord(pair.wordA),
      wordB: resolveWord(pair.wordB),
      targetWord: Math.random() < 0.5 ? 'A' : 'B',
    };
  });
}
