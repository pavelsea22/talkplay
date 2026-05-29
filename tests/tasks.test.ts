import { pickDrillWordLesson } from "../src/tasks/drillWord";
import { evaluateMinPairDiscrim, pickMinPairLesson } from "../src/tasks/minPairDiscrim";
import type { MinPairDiscrimTask } from "../src/tasks/minPairDiscrim";
import { pickLesson, pickLessonForSounds } from "../src/tasks";

// Reusable MinPair fixture: 'tea' (A) vs 'key' (B), target is A.
const teaKey: MinPairDiscrimTask = {
  type: "MinPairDiscrimination",
  wordA: { word: "tea", illustration: "images/words/tea.svg" },
  wordB: { word: "key", illustration: "images/words/key.svg" },
  targetWord: "A",
};

// ---------------------------------------------------------------------------
// pickLesson
// ---------------------------------------------------------------------------

describe("pickLesson", () => {
  it.each([1, 2, 3, 4, 5, 7, 10, 15])(
    "returns exactly %i tasks",
    (n) => {
      expect(pickLesson(n)).toHaveLength(n);
    }
  );
});

// ---------------------------------------------------------------------------
// pickLessonForSounds
// ---------------------------------------------------------------------------

describe("pickLessonForSounds", () => {
  it.each([1, 2, 3, 4, 5, 7, 10, 15])(
    "returns exactly %i tasks with a single sound",
    (n) => {
      expect(pickLessonForSounds(n, ["d"])).toHaveLength(n);
    }
  );

  it.each([1, 2, 3, 4, 5, 7, 10, 15])(
    "returns exactly %i tasks with two sounds",
    (n) => {
      expect(pickLessonForSounds(n, ["d", "t"])).toHaveLength(n);
    }
  );

  // Regression: n=3 with two sounds previously returned 4 tasks because
  // pickLesson(1) over-allocated minPairCount via Math.ceil.
  it("returns exactly 3 tasks with two sounds (regression)", () => {
    expect(pickLessonForSounds(3, ["d", "t"])).toHaveLength(3);
  });

  it("falls back to all sounds when the sounds array is empty", () => {
    expect(pickLessonForSounds(5, [])).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// pickDrillWordLesson
// ---------------------------------------------------------------------------

describe("pickDrillWordLesson", () => {
  const lesson = pickDrillWordLesson(5);

  it("returns the requested number of tasks", () => {
    expect(lesson).toHaveLength(5);
  });

  it("every task has type 'DrillWord'", () => {
    for (const task of lesson) expect(task.type).toBe("DrillWord");
  });

  it("every task has a non-empty word and illustration", () => {
    for (const task of lesson) {
      expect(task.word.length).toBeGreaterThan(0);
      expect(task.illustration.length).toBeGreaterThan(0);
    }
  });

  it("words within a lesson are unique", () => {
    const words = lesson.map(t => t.word);
    expect(new Set(words).size).toBe(words.length);
  });
});

// ---------------------------------------------------------------------------
// evaluateMinPairDiscrim
// ---------------------------------------------------------------------------

describe("evaluateMinPairDiscrim — correct choice", () => {
  const result = evaluateMinPairDiscrim(teaKey, "A", 0);

  it("outcome is 'passed'", () => {
    expect(result.outcome).toBe("passed");
  });

  it("screenClass is 'correct'", () => {
    expect(result.screenClass).toBe("correct");
  });

  it("Cindy is happy", () => {
    expect(result.cindyMood).toBe("happy");
  });

  it("has a spoken success message", () => {
    expect(result.spoken).toBeTruthy();
  });
});

describe("evaluateMinPairDiscrim — wrong choice", () => {
  const result = evaluateMinPairDiscrim(teaKey, "B", 0);

  it("outcome is null (retry still open)", () => {
    expect(result.outcome).toBeNull();
  });

  it("screenClass is 'incorrect'", () => {
    expect(result.screenClass).toBe("incorrect");
  });

  it("Cindy is sad on first wrong attempt", () => {
    expect(result.cindyMood).toBe("sad");
  });

  it("Cindy is crying on second wrong attempt", () => {
    expect(evaluateMinPairDiscrim(teaKey, "B", 1).cindyMood).toBe("crying");
  });
});

describe("evaluateMinPairDiscrim — target can be B", () => {
  const keyTea: MinPairDiscrimTask = { ...teaKey, targetWord: "B" };

  it("passing B when target is B → passed", () => {
    expect(evaluateMinPairDiscrim(keyTea, "B", 0).outcome).toBe("passed");
  });

  it("passing A when target is B → null", () => {
    expect(evaluateMinPairDiscrim(keyTea, "A", 0).outcome).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// pickMinPairLesson
// ---------------------------------------------------------------------------

describe("pickMinPairLesson", () => {
  const lesson = pickMinPairLesson(3);

  it("returns the requested number of tasks", () => {
    expect(lesson).toHaveLength(3);
  });

  it("every task has type 'MinPairDiscrimination'", () => {
    for (const task of lesson) expect(task.type).toBe("MinPairDiscrimination");
  });

  it("every task has two distinct words", () => {
    for (const task of lesson) {
      expect(task.wordA.word).not.toBe(task.wordB.word);
    }
  });

  it("targetWord is always 'A' or 'B'", () => {
    for (const task of lesson) {
      expect(["A", "B"]).toContain(task.targetWord);
    }
  });

  it("illustration paths are resolved to images/words/{word}.svg by default", () => {
    // Pick a large batch to exercise many pairs from the pool.
    const bigLesson = pickMinPairLesson(44);
    for (const task of bigLesson) {
      expect(task.wordA.illustration).toBe(`images/words/${task.wordA.word}.svg`);
      expect(task.wordB.illustration).toBe(`images/words/${task.wordB.word}.svg`);
    }
  });
});
