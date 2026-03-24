const STORAGE_KEY = 'talkplay_streaks';

interface StreakData {
  playedDates: string[]; // sorted "YYYY-MM-DD" strings in local time
}

/**
 * Returns "YYYY-MM-DD" for the given date using the local calendar,
 * avoiding UTC-offset issues that arise from `.toISOString()`.
 */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadData(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {}
  return { playedDates: [] };
}

function saveData(data: StreakData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Records today as a played day. Idempotent — safe to call multiple times
 * within the same day.
 */
export function recordPlayedToday(): void {
  const data = loadData();
  const today = toLocalISODate(new Date());
  if (!data.playedDates.includes(today)) {
    data.playedDates = [...data.playedDates, today].sort();
    saveData(data);
  }
}

/** Returns the set of all dates the user has played, as "YYYY-MM-DD" strings. */
export function getPlayedDates(): Set<string> {
  return new Set(loadData().playedDates);
}

/**
 * Returns the current streak in consecutive days.
 * A streak is still active if the user played yesterday but not yet today.
 */
export function getCurrentStreak(): number {
  const { playedDates } = loadData();
  if (playedDates.length === 0) return 0;

  const set = new Set(playedDates);
  const cursor = new Date();

  // If today hasn't been played, check from yesterday (streak may still be active)
  if (!set.has(toLocalISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(toLocalISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
