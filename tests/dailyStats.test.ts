import { getDailyStats, recordExercise } from '../src/client/dailyStats';
import { installLocalStorageMock } from './helpers/localStorage';

installLocalStorageMock();

function setToday(dateStr: string): void {
  const [y, m, d] = dateStr.split('-').map(Number);
  jest.setSystemTime(new Date(y, m - 1, d, 12, 0, 0));
}

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  setToday('2026-04-28');
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// getDailyStats
// ---------------------------------------------------------------------------

describe('getDailyStats', () => {
  it('returns zeros when no record exists', () => {
    expect(getDailyStats()).toEqual({ date: '2026-04-28', total: 0, correct: 0 });
  });

  it('returns zeros when the stored record is from a previous day', () => {
    setToday('2026-04-27');
    recordExercise('passed');
    setToday('2026-04-28');
    expect(getDailyStats()).toEqual({ date: '2026-04-28', total: 0, correct: 0 });
  });

  it('returns zeros when stored JSON is corrupt', () => {
    localStorage.setItem('talkplay_daily_stats', 'not-valid-json{{{');
    expect(getDailyStats()).toEqual({ date: '2026-04-28', total: 0, correct: 0 });
  });
});

// ---------------------------------------------------------------------------
// recordExercise
// ---------------------------------------------------------------------------

describe('recordExercise', () => {
  it('increments total and correct for a passed exercise', () => {
    recordExercise('passed');
    expect(getDailyStats()).toEqual({ date: '2026-04-28', total: 1, correct: 1 });
  });

  it('increments total but not correct for a failed exercise', () => {
    recordExercise('failed');
    expect(getDailyStats()).toEqual({ date: '2026-04-28', total: 1, correct: 0 });
  });

  it('accumulates multiple exercises correctly', () => {
    recordExercise('passed');
    recordExercise('failed');
    recordExercise('passed');
    recordExercise('passed');
    expect(getDailyStats()).toEqual({ date: '2026-04-28', total: 4, correct: 3 });
  });

  it('resets counts on a new calendar day', () => {
    recordExercise('passed');
    recordExercise('passed');
    setToday('2026-04-29');
    recordExercise('failed');
    expect(getDailyStats()).toEqual({ date: '2026-04-29', total: 1, correct: 0 });
  });

  it('previous day stats are not visible after day change', () => {
    recordExercise('passed');
    setToday('2026-04-29');
    expect(getDailyStats().total).toBe(0);
  });
});
