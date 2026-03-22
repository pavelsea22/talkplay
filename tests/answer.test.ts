import { evaluateDrillWord } from "../src/tasks/drillWord";
import type { DrillWordTask } from "../src/tasks/types";

// Reusable task fixture — the target word for all tests below.
const twelve: DrillWordTask = { type: "DrillWord", word: "twelve", illustration: "" };

describe("Correct answer", () => {
  const outcome = evaluateDrillWord(twelve, "Twelve.", 0);

  it('shows "You got it!" on screen', () => {
    expect(outcome.screenMessage).toBe("You got it!");
    expect(outcome.screenClass).toBe("correct");
  });

  it('speaks "You got it!" without a "Say " prefix', () => {
    expect(outcome.spoken).toBe("You got it!");
    expect(outcome.spoken).not.toMatch(/^Say /i);
  });

  it("shows happy Cindy", () => {
    expect(outcome.cindyMood).toBe("happy");
  });

  it("shows Next button", () => {
    expect(outcome.showNext).toBe(true);
  });

  it("outcome is 'passed'", () => {
    expect(outcome.outcome).toBe("passed");
  });
});

describe("Incorrect answer", () => {
  const outcome = evaluateDrillWord(twelve, "Twenty.", 0);

  it('shows "I heard ... Try again!" on screen', () => {
    expect(outcome.screenMessage).toBe('I heard "twenty". Try again!');
    expect(outcome.screenClass).toBe("incorrect");
  });

  it("speaks the feedback message", () => {
    expect(outcome.spoken).toBe('I heard "twenty", try again!');
  });

  it("shows sad Cindy on first/second attempt", () => {
    expect(outcome.cindyMood).toBe("sad");
  });

  it("hides Next button", () => {
    expect(outcome.showNext).toBe(false);
  });

  it("outcome is null (retry still allowed)", () => {
    expect(outcome.outcome).toBeNull();
  });
});

describe("No speech detected", () => {
  const outcome = evaluateDrillWord(twelve, "", 0);

  it('shows "No speech detected" on screen', () => {
    expect(outcome.screenMessage).toBe("No speech detected — try again!");
  });

  it("speaks the feedback message", () => {
    expect(outcome.spoken).toBe("No speech detected, try again!");
  });
});

describe("Third failed attempt", () => {
  const outcome = evaluateDrillWord(twelve, "Twenty.", 2);

  it("shows crying Cindy", () => {
    expect(outcome.cindyMood).toBe("crying");
  });
});

describe("Azure numeral quirks", () => {
  const two:   DrillWordTask = { type: "DrillWord", word: "two",    illustration: "" };
  const ten:   DrillWordTask = { type: "DrillWord", word: "ten",    illustration: "" };
  const twlv:  DrillWordTask = { type: "DrillWord", word: "twelve", illustration: "" };

  it("accepts '2' transcript for target 'two'", () => {
    expect(evaluateDrillWord(two,  "2.",  0).outcome).toBe("passed");
  });

  it("accepts '10' transcript for target 'ten'", () => {
    expect(evaluateDrillWord(ten,  "10.", 0).outcome).toBe("passed");
  });

  it("accepts '12' transcript for target 'twelve'", () => {
    expect(evaluateDrillWord(twlv, "12.", 0).outcome).toBe("passed");
  });

  it("shows correct numeral in 'I heard' message when wrong", () => {
    const outcome = evaluateDrillWord(twlv, "10.", 0);
    expect(outcome.screenMessage).toBe('I heard "ten". Try again!');
  });
});

describe("Repeated correct word", () => {
  it("accepts when word is said multiple times", () => {
    expect(evaluateDrillWord(twelve, "twelve twelve", 0).outcome).toBe("passed");
  });
});
