import { shuffle } from "./arrayUtils";
import type { DrillWordTask } from "./tasks/types";

export interface WordEntry {
  word: string;
  illustration: string;
}

export interface SoundGroup {
  sound: string;
  label: string;
  positions: {
    leading: WordEntry[];
    trailing: WordEntry[];
    "mid-word": WordEntry[];
  };
}

export const WORD_GROUPS: SoundGroup[] = [
  {
    sound: "t",
    label: "/t/",
    positions: {
      leading: [
        { word: "ten",   illustration: "images/words/ten.svg" },
        { word: "top",   illustration: "images/words/top.svg" },
        { word: "tip",   illustration: "images/words/tip.svg" },
        { word: "tiger", illustration: "images/words/tiger.svg" },
        { word: "tent",  illustration: "images/words/tent.svg" },
        { word: "time",  illustration: "images/words/time.svg" },
        { word: "tea",   illustration: "images/words/tea.svg" },
        { word: "tree",  illustration: "images/words/tree.svg" },
        { word: "talk",  illustration: "images/words/talk.svg" },
        { word: "truck", illustration: "images/words/truck.svg" },
      ],
      trailing: [],
      "mid-word": [],
    },
  },
];

/**
 * Returns all non-empty WordEntry items across all groups and positions.
 * Only positions with at least one entry are included.
 */
export function getActiveWords(): WordEntry[] {
  return WORD_GROUPS.flatMap(group =>
    Object.values(group.positions).flat()
  );
}

// Shuffled queue of words for the current session. Refills automatically when exhausted.
let wordQueue: WordEntry[] = [];

/**
 * Returns the next WordEntry from the session queue, ensuring no word repeats
 * until all words have been used. Reshuffles when the queue is exhausted.
 */
export function pickWord(): WordEntry {
  if (wordQueue.length === 0) {
    wordQueue = shuffle(getActiveWords());
  }
  return wordQueue.pop()!;
}

/**
 * Picks n DrillWord tasks for a lesson, with no repeats within the lesson.
 * WordEntry is kept as the internal data shape; this function lifts each
 * entry into a DrillWordTask so callers work with the Task abstraction.
 */
export function pickLesson(n: number): DrillWordTask[] {
  const tasks: DrillWordTask[] = [];
  for (let i = 0; i < n; i++) {
    const entry = pickWord();
    tasks.push({ type: 'DrillWord', word: entry.word, illustration: entry.illustration });
  }
  return tasks;
}
