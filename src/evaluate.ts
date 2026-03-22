export const NUM_WORDS: Record<string, string> = {
  "0":"zero","1":"one","2":"two","3":"three","4":"four","5":"five",
  "6":"six","7":"seven","8":"eight","9":"nine","10":"ten","11":"eleven",
  "12":"twelve","13":"thirteen","20":"twenty","30":"thirty",
  "100":"hundred","1000":"thousand","1000000":"million","1000000000000":"trillion"
};

/**
 * Maps known Azure mis-transcriptions (due to accent/pronunciation variants)
 * to the intended word. Applied after numeral conversion during normalization.
 */
export const PHONETIC_VARIANTS: Record<string, string> = {
  "tony": "twenty",   // American reduction: "twenny" → Azure hears "tony"
};

/**
 * Normalizes a speech transcript into an array of lowercase words.
 * Converts numeric digits to their word equivalents (e.g. "10" → "ten"),
 * applies phonetic variant corrections (e.g. "tony" → "twenty"),
 * strips punctuation, and splits on whitespace.
 */
export function normalizeTranscript(transcript: string): string[] {
  return transcript.toLowerCase()
    .replace(/\b\d+\b/g, n => NUM_WORDS[n] || n)
    .replace(/[^a-z ]/g, "").trim().split(/\s+/)
    .map(w => PHONETIC_VARIANTS[w] ?? w);
}

