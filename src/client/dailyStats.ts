import { toLocalISODate } from './streaks';
import type { TaskOutcome } from '../tasks';

const STORAGE_KEY = 'talkplay_daily_stats';

/** Per-day exercise statistics. */
export interface DailyStats {
  /** Local "YYYY-MM-DD" date these stats belong to. */
  date: string;
  /** Total number of exercises completed (passed or failed). */
  total: number;
  /** Number of exercises that ended with outcome 'passed'. */
  correct: number;
}

function loadRecord(): DailyStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DailyStats;
  } catch {}
  return { date: toLocalISODate(new Date()), total: 0, correct: 0 };
}

function saveRecord(record: DailyStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/** Returns today's exercise stats, or zeroed-out stats if none exist yet. */
export function getDailyStats(): DailyStats {
  const record = loadRecord();
  const today = toLocalISODate(new Date());
  if (record.date !== today) {
    return { date: today, total: 0, correct: 0 };
  }
  return record;
}

/**
 * Records the completion of one exercise for today.
 * Resets counts automatically when called on a new calendar day.
 *
 * @param outcome - The outcome of the completed exercise.
 */
export function recordExercise(outcome: TaskOutcome): void {
  const today = toLocalISODate(new Date());
  const record = loadRecord();
  const base = record.date === today ? record : { date: today, total: 0, correct: 0 };
  saveRecord({
    date: today,
    total: base.total + 1,
    correct: base.correct + (outcome === 'passed' ? 1 : 0),
  });
}
