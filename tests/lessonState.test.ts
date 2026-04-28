import {
  getParentConfig,
  setParentConfig,
  getTodayStatus,
  markTodayStarted,
  markTodayCompleted,
  DEFAULT_PARENT_CONFIG,
} from '../src/client/lessonState';

// Mock localStorage for the Node test environment.
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

/** Sets the system clock to noon on the given local date string "YYYY-MM-DD". */
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
// getParentConfig / setParentConfig
// ---------------------------------------------------------------------------

describe('getParentConfig', () => {
  it('returns defaults when localStorage is empty', () => {
    expect(getParentConfig()).toEqual(DEFAULT_PARENT_CONFIG);
  });

  it('returns defaults when stored JSON is corrupt', () => {
    localStorage.setItem('talkplay_parent_config', 'not-valid-json{{{');
    expect(getParentConfig()).toEqual(DEFAULT_PARENT_CONFIG);
  });

  it('round-trips correctly with setParentConfig', () => {
    const config = { sounds: ['t', 'd'], exerciseCount: 7 };
    setParentConfig(config);
    expect(getParentConfig()).toEqual(config);
  });

  it('falls back to default sounds when stored sounds is an empty array', () => {
    localStorage.setItem(
      'talkplay_parent_config',
      JSON.stringify({ sounds: [], exerciseCount: 5 }),
    );
    expect(getParentConfig().sounds).toEqual(DEFAULT_PARENT_CONFIG.sounds);
  });

  it('falls back to default exerciseCount when stored value is 0', () => {
    localStorage.setItem(
      'talkplay_parent_config',
      JSON.stringify({ sounds: ['t'], exerciseCount: 0 }),
    );
    expect(getParentConfig().exerciseCount).toBe(DEFAULT_PARENT_CONFIG.exerciseCount);
  });

  it('falls back to default exerciseCount when stored value is negative', () => {
    localStorage.setItem(
      'talkplay_parent_config',
      JSON.stringify({ sounds: ['t'], exerciseCount: -3 }),
    );
    expect(getParentConfig().exerciseCount).toBe(DEFAULT_PARENT_CONFIG.exerciseCount);
  });
});

// ---------------------------------------------------------------------------
// getTodayStatus
// ---------------------------------------------------------------------------

describe('getTodayStatus', () => {
  it('returns not_started when no record exists', () => {
    expect(getTodayStatus()).toBe('not_started');
  });

  it('returns not_started when the stored record is from a previous day', () => {
    // Write a record for yesterday, then advance the clock to today.
    setToday('2026-04-27');
    markTodayStarted();
    setToday('2026-04-28');
    expect(getTodayStatus()).toBe('not_started');
  });

  it('returns not_started when stored JSON is corrupt', () => {
    localStorage.setItem('talkplay_today_lesson', 'not-valid-json{{{');
    expect(getTodayStatus()).toBe('not_started');
  });
});

// ---------------------------------------------------------------------------
// markTodayStarted / markTodayCompleted
// ---------------------------------------------------------------------------

describe('markTodayStarted', () => {
  it('sets status to in_progress', () => {
    markTodayStarted();
    expect(getTodayStatus()).toBe('in_progress');
  });

  it('is idempotent — calling multiple times stays in_progress', () => {
    markTodayStarted();
    markTodayStarted();
    markTodayStarted();
    expect(getTodayStatus()).toBe('in_progress');
  });

  it('does NOT downgrade completed back to in_progress', () => {
    markTodayCompleted();
    markTodayStarted();
    expect(getTodayStatus()).toBe('completed');
  });
});

describe('markTodayCompleted', () => {
  it('sets status to completed', () => {
    markTodayCompleted();
    expect(getTodayStatus()).toBe('completed');
  });

  it('upgrades in_progress to completed', () => {
    markTodayStarted();
    markTodayCompleted();
    expect(getTodayStatus()).toBe('completed');
  });
});
