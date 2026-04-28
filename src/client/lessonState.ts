import { WORD_GROUPS } from '../words';
import { toLocalISODate } from './streaks';

const PARENT_CONFIG_KEY = 'talkplay_parent_config';
const TODAY_LESSON_KEY = 'talkplay_today_lesson';

/** Parent-configured lesson settings, applied to "Today's Lesson" runs. */
export interface ParentConfig {
  /** Sounds the lesson should draw from (e.g. ['t', 'd']). Empty means all. */
  sounds: string[];
  /** Total number of exercises in the daily lesson. */
  exerciseCount: number;
}

/** Default config when no parent has configured anything yet. */
export const DEFAULT_PARENT_CONFIG: ParentConfig = {
  sounds: WORD_GROUPS.map(g => g.sound),
  exerciseCount: 5,
};

/** State of the user's progress through today's lesson. */
export type TodayStatus = 'not_started' | 'in_progress' | 'completed';

interface TodayRecord {
  /** Local "YYYY-MM-DD" date the record was written for. */
  date: string;
  status: 'in_progress' | 'completed';
}

/**
 * Reads the stored parent config, or returns sensible defaults if nothing
 * has been saved yet (or storage is corrupt).
 */
export function getParentConfig(): ParentConfig {
  try {
    const raw = localStorage.getItem(PARENT_CONFIG_KEY);
    if (!raw) return DEFAULT_PARENT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ParentConfig>;
    return {
      sounds: Array.isArray(parsed.sounds) && parsed.sounds.length > 0
        ? parsed.sounds
        : DEFAULT_PARENT_CONFIG.sounds,
      exerciseCount: typeof parsed.exerciseCount === 'number' && parsed.exerciseCount > 0
        ? parsed.exerciseCount
        : DEFAULT_PARENT_CONFIG.exerciseCount,
    };
  } catch {
    return DEFAULT_PARENT_CONFIG;
  }
}

/** Persists the parent config. */
export function setParentConfig(config: ParentConfig): void {
  localStorage.setItem(PARENT_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Returns the status of today's lesson:
 *   not_started — no record, or the stored record is from a previous day
 *   in_progress — started today, not yet completed
 *   completed   — finished today
 */
export function getTodayStatus(): TodayStatus {
  try {
    const raw = localStorage.getItem(TODAY_LESSON_KEY);
    if (!raw) return 'not_started';
    const record = JSON.parse(raw) as TodayRecord;
    if (record.date !== toLocalISODate(new Date())) return 'not_started';
    return record.status;
  } catch {
    return 'not_started';
  }
}

/** Marks today's lesson as started (idempotent within the same day). */
export function markTodayStarted(): void {
  // Don't downgrade an already-completed lesson back to in_progress.
  if (getTodayStatus() === 'completed') return;
  const record: TodayRecord = {
    date: toLocalISODate(new Date()),
    status: 'in_progress',
  };
  localStorage.setItem(TODAY_LESSON_KEY, JSON.stringify(record));
}

/** Marks today's lesson as completed. */
export function markTodayCompleted(): void {
  const record: TodayRecord = {
    date: toLocalISODate(new Date()),
    status: 'completed',
  };
  localStorage.setItem(TODAY_LESSON_KEY, JSON.stringify(record));
}

/**
 * Resets today's lesson back to `not_started` by removing the stored record.
 * Intended for the Parent Portal so a parent can let the child redo the lesson.
 */
export function resetTodayLesson(): void {
  localStorage.removeItem(TODAY_LESSON_KEY);
}
