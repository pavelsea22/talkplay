import { recordPlayedToday, getPlayedDates, getCurrentStreak, toLocalISODate } from '../src/client/streaks';

// Mock localStorage for the Node test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

/** Sets the system clock to the given local date string "YYYY-MM-DD". */
function setToday(dateStr: string): void {
  const [y, m, d] = dateStr.split('-').map(Number);
  jest.setSystemTime(new Date(y, m - 1, d, 12, 0, 0));
}

/** Returns a date string N days before `from`. */
function daysAgo(n: number, from: string): string {
  const [y, m, d] = from.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - n);
  return toLocalISODate(date);
}

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('toLocalISODate', () => {
  it('formats a date in local time', () => {
    const date = new Date(2026, 2, 23, 15, 0, 0); // March 23, 2026, 3pm local
    expect(toLocalISODate(date)).toBe('2026-03-23');
  });

  it('pads month and day with leading zeros', () => {
    const date = new Date(2026, 0, 5, 12, 0, 0); // Jan 5
    expect(toLocalISODate(date)).toBe('2026-01-05');
  });
});

describe('recordPlayedToday', () => {
  it('adds today to the played dates', () => {
    setToday('2026-03-23');
    recordPlayedToday();
    expect(getPlayedDates().has('2026-03-23')).toBe(true);
  });

  it('is idempotent — calling twice does not duplicate the date', () => {
    setToday('2026-03-23');
    recordPlayedToday();
    recordPlayedToday();
    expect(getPlayedDates().size).toBe(1);
  });

  it('stores dates sorted ascending', () => {
    setToday('2026-03-21');
    recordPlayedToday();
    setToday('2026-03-23');
    recordPlayedToday();
    setToday('2026-03-22');
    recordPlayedToday();
    const dates = [...getPlayedDates()].sort();
    expect(dates).toEqual(['2026-03-21', '2026-03-22', '2026-03-23']);
  });
});

describe('getPlayedDates', () => {
  it('returns an empty set when nothing has been recorded', () => {
    expect(getPlayedDates().size).toBe(0);
  });

  it('returns all recorded dates', () => {
    setToday('2026-03-22');
    recordPlayedToday();
    setToday('2026-03-23');
    recordPlayedToday();
    const dates = getPlayedDates();
    expect(dates.has('2026-03-22')).toBe(true);
    expect(dates.has('2026-03-23')).toBe(true);
  });
});

describe('getCurrentStreak', () => {
  it('returns 0 when no days have been played', () => {
    setToday('2026-03-23');
    expect(getCurrentStreak()).toBe(0);
  });

  it('returns 1 when only today has been played', () => {
    setToday('2026-03-23');
    recordPlayedToday();
    expect(getCurrentStreak()).toBe(1);
  });

  it('returns 1 when only yesterday was played (streak still active)', () => {
    setToday('2026-03-22');
    recordPlayedToday();
    setToday('2026-03-23');
    expect(getCurrentStreak()).toBe(1);
  });

  it('returns 0 when last played day was 2 days ago (streak broken)', () => {
    setToday('2026-03-21');
    recordPlayedToday();
    setToday('2026-03-23');
    expect(getCurrentStreak()).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const today = '2026-03-23';
    setToday(daysAgo(4, today)); recordPlayedToday();
    setToday(daysAgo(3, today)); recordPlayedToday();
    setToday(daysAgo(2, today)); recordPlayedToday();
    setToday(daysAgo(1, today)); recordPlayedToday();
    setToday(today);             recordPlayedToday();
    expect(getCurrentStreak()).toBe(5);
  });

  it('counts consecutive days ending yesterday when today is not yet played', () => {
    const today = '2026-03-23';
    setToday(daysAgo(3, today)); recordPlayedToday();
    setToday(daysAgo(2, today)); recordPlayedToday();
    setToday(daysAgo(1, today)); recordPlayedToday();
    setToday(today);
    expect(getCurrentStreak()).toBe(3);
  });

  it('ignores older isolated dates when a gap exists', () => {
    const today = '2026-03-23';
    // Played 10 days ago, then resumed today — not a streak of 2
    setToday(daysAgo(10, today)); recordPlayedToday();
    setToday(today);              recordPlayedToday();
    expect(getCurrentStreak()).toBe(1);
  });
});
