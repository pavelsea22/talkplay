import type { PhonemeAssessment } from '../shared/types';

/** Phonemes whose score must be below this to warrant a hint. */
const HINT_THRESHOLD = 60;

/**
 * Maps specific therapy-target IPA symbols to child-friendly hint strings.
 * Keys are IPA characters; values are spoken/displayed hints.
 */
const PHONEME_HINTS: Record<string, string> = {
  'ɹ': 'Try curling your tongue back a little for that "r" sound.',
  'w': 'Round your lips like you\'re blowing out a candle for the "w" sound.',
  'ð': 'Put your tongue between your teeth for the "th" sound — like "the".',
  'θ': 'Put your tongue between your teeth for the "th" sound — like "think".',
  't': 'Tap the tip of your tongue just behind your top teeth for the "t" sound.',
};

/** Generic fallback hint for phonemes below threshold with no specific mapping. */
const GENERIC_HINT = 'Listen carefully to that sound and try again!';

/**
 * Finds the lowest-scoring phoneme in the assessment and returns a child-friendly
 * hint string if its accuracy score is below {@link HINT_THRESHOLD}.
 *
 * Returns null if all phonemes score ≥ HINT_THRESHOLD (no hint needed).
 *
 * @param assessment - Phoneme-level assessment data from Azure.
 * @returns A hint string, or null if no hint is needed.
 */
export function getWeakestPhonemeHint(assessment: PhonemeAssessment): string | null {
  if (assessment.phonemes.length === 0) return null;

  const weakest = assessment.phonemes.reduce((a, b) =>
    a.accuracyScore <= b.accuracyScore ? a : b
  );

  if (weakest.accuracyScore >= HINT_THRESHOLD) return null;

  return PHONEME_HINTS[weakest.phoneme] ?? GENERIC_HINT;
}
