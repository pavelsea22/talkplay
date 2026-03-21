export const NUM_WORDS: Record<string, string> = {
  "0":"zero","1":"one","2":"two","3":"three","4":"four","5":"five",
  "6":"six","7":"seven","8":"eight","9":"nine","10":"ten","11":"eleven",
  "12":"twelve","13":"thirteen","20":"twenty","30":"thirty",
  "100":"hundred","1000":"thousand","1000000":"million","1000000000000":"trillion"
};

export function normalizeTranscript(transcript: string): string[] {
  return transcript.toLowerCase()
    .replace(/\b\d+\b/g, n => NUM_WORDS[n] || n)
    .replace(/[^a-z ]/g, "").trim().split(/\s+/);
}

export interface AnswerOutcome {
  correct: boolean;
  screenMessage: string;
  screenClass: "correct" | "incorrect";
  cindyMood: "happy" | "sad" | "crying";
  spoken: string | null;
  showNext: boolean;
}

/** retryCount: number of failed attempts *before* this one (0 = first attempt) */
export function processAnswer(
  transcript: string,
  targetWord: string,
  retryCount: number
): AnswerOutcome {
  const target = targetWord.toLowerCase().replace(/[^a-z]/g, "").trim();
  const heard = normalizeTranscript(transcript);
  const correct = heard.some(w => w === target);
  const displayHeard = heard.join(" ").trim();

  if (correct) {
    return {
      correct: true,
      screenMessage: "You got it!",
      screenClass: "correct",
      cindyMood: "happy",
      spoken: "You got it!",
      showNext: true,
    };
  }

  const screenMessage = !displayHeard
    ? "No speech detected — try again!"
    : `I heard "${displayHeard}". Try again!`;

  return {
    correct: false,
    screenMessage,
    screenClass: "incorrect",
    cindyMood: retryCount >= 2 ? "crying" : "sad",
    spoken: screenMessage,
    showNext: false,
  };
}
