import { processAnswer } from "../src/evaluate";

describe("Correct answer", () => {
  const outcome = processAnswer("Twelve.", "twelve", 0);

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
});

describe("Incorrect answer", () => {
  const outcome = processAnswer("Twenty.", "twelve", 0);

  it('shows "I heard ... Try again!" on screen', () => {
    expect(outcome.screenMessage).toBe('I heard "twenty". Try again!');
    expect(outcome.screenClass).toBe("incorrect");
  });

  it("speaks the feedback message", () => {
    expect(outcome.spoken).toBe("I heard twenty, try again!");
  });

  it("shows sad Cindy on first/second attempt", () => {
    expect(outcome.cindyMood).toBe("sad");
  });

  it("hides Next button", () => {
    expect(outcome.showNext).toBe(false);
  });
});

describe("No speech detected", () => {
  const outcome = processAnswer("", "twelve", 0);

  it('shows "No speech detected" on screen', () => {
    expect(outcome.screenMessage).toBe("No speech detected — try again!");
  });

  it("speaks the feedback message", () => {
    expect(outcome.spoken).toBe("No speech detected, try again!");
  });
});

describe("Third failed attempt", () => {
  const outcome = processAnswer("Twenty.", "twelve", 2);

  it("shows crying Cindy", () => {
    expect(outcome.cindyMood).toBe("crying");
  });
});

describe("Azure numeral quirks", () => {
  it("accepts '2' transcript for target 'two'", () => {
    expect(processAnswer("2.", "two", 0).correct).toBe(true);
  });

  it("accepts '10' transcript for target 'ten'", () => {
    expect(processAnswer("10.", "ten", 0).correct).toBe(true);
  });

  it("accepts '12' transcript for target 'twelve'", () => {
    expect(processAnswer("12.", "twelve", 0).correct).toBe(true);
  });

  it("shows correct numeral in 'I heard' message when wrong", () => {
    const outcome = processAnswer("10.", "twelve", 0);
    expect(outcome.screenMessage).toBe('I heard "ten". Try again!');
  });
});

describe("Repeated correct word", () => {
  it("accepts when word is said multiple times", () => {
    expect(processAnswer("twelve twelve", "twelve", 0).correct).toBe(true);
  });
});
