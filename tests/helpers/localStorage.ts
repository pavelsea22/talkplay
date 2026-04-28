/**
 * In-memory localStorage mock for Jest (Node test environment).
 *
 * Install once per test file with:
 *   import { installLocalStorageMock } from './helpers/localStorage';
 *   installLocalStorageMock();
 *
 * Call `localStorage.clear()` in `beforeEach` to prevent state leakage
 * between tests.
 */

export interface LocalStorageMock {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Creates and installs a fresh in-memory localStorage mock on `global`.
 * Safe to call multiple times — subsequent calls replace the previous mock.
 *
 * @returns The installed mock so tests can interact with it directly.
 */
export function installLocalStorageMock(): LocalStorageMock {
  let store: Record<string, string> = {};

  const mock: LocalStorageMock = {
    getItem:    (key)        => store[key] ?? null,
    setItem:    (key, value) => { store[key] = value; },
    removeItem: (key)        => { delete store[key]; },
    clear:      ()           => { store = {}; },
  };

  Object.defineProperty(global, 'localStorage', { value: mock, configurable: true });
  return mock;
}
