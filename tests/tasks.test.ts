import { evaluateTask } from "../src/tasks";
import { pickLesson } from "../src/words";

// ---------------------------------------------------------------------------
// evaluateTask — dispatcher
// ---------------------------------------------------------------------------

describe("evaluateTask — DrillWord dispatch", () => {
  const task = { type: "DrillWord" as const, word: "tea", illustration: "" };

  it("returns passed for a correct transcript", () => {
    expect(evaluateTask(task, "tea", 0).outcome).toBe("passed");
  });

  it("returns null outcome for an incorrect transcript (retry still open)", () => {
    expect(evaluateTask(task, "sea", 0).outcome).toBeNull();
  });

  it("delegates retryCount to the evaluator (crying Cindy at 2)", () => {
    expect(evaluateTask(task, "sea", 2).cindyMood).toBe("crying");
  });
});

describe("evaluateTask — exhaustive type guard", () => {
  it("throws on an unknown task type", () => {
    // Cast to bypass TypeScript so we can test the runtime guard.
    const bad = { type: "UnknownType" } as never;
    expect(() => evaluateTask(bad, "tea", 0)).toThrow("Unknown task type");
  });
});

// ---------------------------------------------------------------------------
// pickLesson — task shape
// ---------------------------------------------------------------------------

describe("pickLesson", () => {
  const lesson = pickLesson(5);

  it("returns the requested number of tasks", () => {
    expect(lesson).toHaveLength(5);
  });

  it("every task has type 'DrillWord'", () => {
    for (const task of lesson) {
      expect(task.type).toBe("DrillWord");
    }
  });

  it("every task has a non-empty word and illustration", () => {
    for (const task of lesson) {
      expect(task.word.length).toBeGreaterThan(0);
      expect(task.illustration.length).toBeGreaterThan(0);
    }
  });

  it("tasks within a lesson are unique words", () => {
    const words = lesson.map(t => t.word);
    expect(new Set(words).size).toBe(words.length);
  });
});
