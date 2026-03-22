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
 */
export function getActiveWords(): WordEntry[] {
  return WORD_GROUPS.flatMap(group =>
    Object.values(group.positions).flat()
  );
}

