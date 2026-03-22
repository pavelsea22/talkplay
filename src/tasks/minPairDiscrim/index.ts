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
 * Illustration paths resolve to public/images/words/{word}.svg;
 * missing SVGs are hidden gracefully by the Activity's onerror handler.
 */
const MIN_PAIRS: MinPair[] = [
  // ── Leading /t/ — initial-consonant contrast ──────────────────────────────
  { wordA: { word: 'tea',  illustration: 'images/words/tea.svg'  },
    wordB: { word: 'sea',  illustration: 'images/words/sea.svg'  } },  // t/s
  { wordA: { word: 'tea',  illustration: 'images/words/tea.svg'  },
    wordB: { word: 'pea',  illustration: 'images/words/pea.svg'  } },  // t/p
  { wordA: { word: 'tea',  illustration: 'images/words/tea.svg'  },
    wordB: { word: 'bee',  illustration: 'images/words/bee.svg'  } },  // t/b
  { wordA: { word: 'tea',  illustration: 'images/words/tea.svg'  },
    wordB: { word: 'key',  illustration: 'images/words/key.svg'  } },  // t/k
  { wordA: { word: 'top',  illustration: 'images/words/top.svg'  },
    wordB: { word: 'hop',  illustration: 'images/words/hop.svg'  } },  // t/h
  { wordA: { word: 'top',  illustration: 'images/words/top.svg'  },
    wordB: { word: 'mop',  illustration: 'images/words/mop.svg'  } },  // t/m
  { wordA: { word: 'top',  illustration: 'images/words/top.svg'  },
    wordB: { word: 'pop',  illustration: 'images/words/pop.svg'  } },  // t/p
  { wordA: { word: 'tap',  illustration: 'images/words/tap.svg'  },
    wordB: { word: 'cap',  illustration: 'images/words/cap.svg'  } },  // t/k
  { wordA: { word: 'tap',  illustration: 'images/words/tap.svg'  },
    wordB: { word: 'map',  illustration: 'images/words/map.svg'  } },  // t/m
  { wordA: { word: 'tail', illustration: 'images/words/tail.svg' },
    wordB: { word: 'nail', illustration: 'images/words/nail.svg' } },  // t/n
  { wordA: { word: 'tail', illustration: 'images/words/tail.svg' },
    wordB: { word: 'sail', illustration: 'images/words/sail.svg' } },  // t/s
  { wordA: { word: 'tail', illustration: 'images/words/tail.svg' },
    wordB: { word: 'mail', illustration: 'images/words/mail.svg' } },  // t/m
  { wordA: { word: 'ten',  illustration: 'images/words/ten.svg'  },
    wordB: { word: 'hen',  illustration: 'images/words/hen.svg'  } },  // t/h
  { wordA: { word: 'ten',  illustration: 'images/words/ten.svg'  },
    wordB: { word: 'pen',  illustration: 'images/words/pen.svg'  } },  // t/p
  { wordA: { word: 'tie',  illustration: 'images/words/tie.svg'  },
    wordB: { word: 'pie',  illustration: 'images/words/pie.svg'  } },  // t/p
  { wordA: { word: 'toad', illustration: 'images/words/toad.svg' },
    wordB: { word: 'road', illustration: 'images/words/road.svg' } },  // t/r
  { wordA: { word: 'toy',  illustration: 'images/words/toy.svg'  },
    wordB: { word: 'boy',  illustration: 'images/words/boy.svg'  } },  // t/b
  { wordA: { word: 'tall', illustration: 'images/words/tall.svg' },
    wordB: { word: 'ball', illustration: 'images/words/ball.svg' } },  // t/b
  { wordA: { word: 'tank', illustration: 'images/words/tank.svg' },
    wordB: { word: 'bank', illustration: 'images/words/bank.svg' } },  // t/b
  { wordA: { word: 'tire', illustration: 'images/words/tire.svg' },
    wordB: { word: 'fire', illustration: 'images/words/fire.svg' } },  // t/f
  { wordA: { word: 'tip',  illustration: 'images/words/tip.svg'  },
    wordB: { word: 'dip',  illustration: 'images/words/dip.svg'  } },  // t/d
  { wordA: { word: 'time', illustration: 'images/words/time.svg' },
    wordB: { word: 'dime', illustration: 'images/words/dime.svg' } },  // t/d

  // ── Trailing /t/ — final-consonant contrast ────────────────────────────────
  { wordA: { word: 'cat',  illustration: 'images/words/cat.svg'  },
    wordB: { word: 'cap',  illustration: 'images/words/cap.svg'  } },  // t/p
  { wordA: { word: 'cat',  illustration: 'images/words/cat.svg'  },
    wordB: { word: 'cab',  illustration: 'images/words/cab.svg'  } },  // t/b
  { wordA: { word: 'bat',  illustration: 'images/words/bat.svg'  },
    wordB: { word: 'bag',  illustration: 'images/words/bag.svg'  } },  // t/g
  { wordA: { word: 'hat',  illustration: 'images/words/hat.svg'  },
    wordB: { word: 'ham',  illustration: 'images/words/ham.svg'  } },  // t/m
  { wordA: { word: 'mat',  illustration: 'images/words/mat.svg'  },
    wordB: { word: 'map',  illustration: 'images/words/map.svg'  } },  // t/p
  { wordA: { word: 'hot',  illustration: 'images/words/hot.svg'  },
    wordB: { word: 'hop',  illustration: 'images/words/hop.svg'  } },  // t/p
  { wordA: { word: 'hot',  illustration: 'images/words/hot.svg'  },
    wordB: { word: 'hog',  illustration: 'images/words/hog.svg'  } },  // t/g
  { wordA: { word: 'pot',  illustration: 'images/words/pot.svg'  },
    wordB: { word: 'pop',  illustration: 'images/words/pop.svg'  } },  // t/p
  { wordA: { word: 'dot',  illustration: 'images/words/dot.svg'  },
    wordB: { word: 'dog',  illustration: 'images/words/dog.svg'  } },  // t/g
  { wordA: { word: 'bit',  illustration: 'images/words/bit.svg'  },
    wordB: { word: 'big',  illustration: 'images/words/big.svg'  } },  // t/g
  { wordA: { word: 'bit',  illustration: 'images/words/bit.svg'  },
    wordB: { word: 'bin',  illustration: 'images/words/bin.svg'  } },  // t/n
  { wordA: { word: 'sit',  illustration: 'images/words/sit.svg'  },
    wordB: { word: 'sip',  illustration: 'images/words/sip.svg'  } },  // t/p
  { wordA: { word: 'hit',  illustration: 'images/words/hit.svg'  },
    wordB: { word: 'hip',  illustration: 'images/words/hip.svg'  } },  // t/p
  { wordA: { word: 'cut',  illustration: 'images/words/cut.svg'  },
    wordB: { word: 'cup',  illustration: 'images/words/cup.svg'  } },  // t/p
  { wordA: { word: 'cut',  illustration: 'images/words/cut.svg'  },
    wordB: { word: 'cub',  illustration: 'images/words/cub.svg'  } },  // t/b
  { wordA: { word: 'nut',  illustration: 'images/words/nut.svg'  },
    wordB: { word: 'nun',  illustration: 'images/words/nun.svg'  } },  // t/n
  { wordA: { word: 'hut',  illustration: 'images/words/hut.svg'  },
    wordB: { word: 'hug',  illustration: 'images/words/hug.svg'  } },  // t/g
  { wordA: { word: 'boot', illustration: 'images/words/boot.svg' },
    wordB: { word: 'book', illustration: 'images/words/book.svg' } },  // t/k
  { wordA: { word: 'beat', illustration: 'images/words/beat.svg' },
    wordB: { word: 'bead', illustration: 'images/words/bead.svg' } },  // t/d
  { wordA: { word: 'boat', illustration: 'images/words/boat.svg' },
    wordB: { word: 'bone', illustration: 'images/words/bone.svg' } },  // t/n
  { wordA: { word: 'night',illustration: 'images/words/night.svg'},
    wordB: { word: 'nine', illustration: 'images/words/nine.svg' } },  // t/n
  { wordA: { word: 'bite', illustration: 'images/words/bite.svg' },
    wordB: { word: 'bike', illustration: 'images/words/bike.svg' } },  // t/k
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
