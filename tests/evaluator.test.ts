import { evaluateDrillWord, PASS_THRESHOLD, RETRY_THRESHOLD } from "../src/tasks/drillWord/evaluator";
import type { DrillWordTask } from "../src/tasks/drillWord";
import type { PhonemeAssessment } from "../src/tasks/shared/types";

const task: DrillWordTask = {
  type: "DrillWord",
  word: "rabbit",
  illustration: "images/words/rabbit.svg",
};

const phonemes: PhonemeAssessment["phonemes"] = [
  { phoneme: "ɹ", accuracyScore: 40 },
  { phoneme: "æ", accuracyScore: 90 },
  { phoneme: "b", accuracyScore: 95 },
  { phoneme: "ɪ", accuracyScore: 88 },
  { phoneme: "t", accuracyScore: 82 },
];

function makeAssessment(accuracyScore: number): PhonemeAssessment {
  return { accuracyScore, phonemes };
}

// ---------------------------------------------------------------------------
// With assessment present
// ---------------------------------------------------------------------------

describe("evaluateDrillWord — assessment present, pass band (≥ PASS_THRESHOLD)", () => {
  const result = evaluateDrillWord(task, "rabbit", makeAssessment(PASS_THRESHOLD), 0);

  it("outcome is 'passed'", () => {
    expect(result.outcome).toBe("passed");
  });

  it("screenClass is 'correct'", () => {
    expect(result.screenClass).toBe("correct");
  });

  it("Cindy is happy", () => {
    expect(result.cindyMood).toBe("happy");
  });
});

describe("evaluateDrillWord — assessment present, retry band (≥ RETRY_THRESHOLD, < PASS_THRESHOLD)", () => {
  const result = evaluateDrillWord(task, "rabbit", makeAssessment(RETRY_THRESHOLD), 0);

  it("outcome is null (retry available)", () => {
    expect(result.outcome).toBeNull();
  });

  it("screenClass is 'incorrect'", () => {
    expect(result.screenClass).toBe("incorrect");
  });

  it("Cindy is sad on first failed attempt", () => {
    expect(result.cindyMood).toBe("sad");
  });

  it("Cindy is crying after two failed attempts", () => {
    expect(evaluateDrillWord(task, "rabbit", makeAssessment(RETRY_THRESHOLD), 2).cindyMood).toBe("crying");
  });
});

describe("evaluateDrillWord — assessment present, fail band (< RETRY_THRESHOLD)", () => {
  const result = evaluateDrillWord(task, "rabbit", makeAssessment(RETRY_THRESHOLD - 1), 0);

  it("outcome is null (caller promotes to failed at MAX_RETRIES)", () => {
    expect(result.outcome).toBeNull();
  });

  it("screenClass is 'incorrect'", () => {
    expect(result.screenClass).toBe("incorrect");
  });
});

// ---------------------------------------------------------------------------
// With assessment absent — string-match fallback
// ---------------------------------------------------------------------------

describe("evaluateDrillWord — assessment null, string-match fallback", () => {
  it("passes on exact match (normalised)", () => {
    expect(evaluateDrillWord(task, "Rabbit.", null, 0).outcome).toBe("passed");
  });

  it("returns null on mismatch", () => {
    expect(evaluateDrillWord(task, "habit", null, 0).outcome).toBeNull();
  });

  it("returns null on empty transcript", () => {
    expect(evaluateDrillWord(task, "", null, 0).outcome).toBeNull();
  });

  it("screenMessage mentions what was heard on mismatch", () => {
    const result = evaluateDrillWord(task, "habit", null, 0);
    expect(result.screenMessage).toContain("habit");
  });

  it("screenMessage says couldn't hear you on empty transcript", () => {
    const result = evaluateDrillWord(task, "", null, 0);
    expect(result.screenMessage).toMatch(/couldn't hear/i);
  });
});
