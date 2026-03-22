/**
 * Positive feedback phrases shown/spoken when the user answers correctly.
 * Picked randomly so responses feel varied rather than repetitive.
 */
const PHRASES = [
  'Great job!',
  'Well done!',
  'You got it!',
  "That's right!",
  'Fantastic!',
  'Nailed it!',
  'Super star!',
  'Brilliant!',
] as const;

/**
 * Returns a random praise phrase from the built-in list.
 * Each call samples independently, so the same phrase may appear twice in a row.
 */
export function randomPraise(): string {
  return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}
