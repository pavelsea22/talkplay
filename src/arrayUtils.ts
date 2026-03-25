/**
 * Shuffles an array in-place using the Fisher-Yates algorithm.
 *
 * @template T - The type of elements in the array.
 * @param arr - The array to shuffle.
 * @returns The same array, shuffled in-place.
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
