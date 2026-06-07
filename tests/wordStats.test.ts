import {
  getWordStats,
  getPhonemeStats,
  recordAttempt,
  EMA_ALPHA,
} from '../src/client/wordStats';
import type { PhonemeAssessment } from '../src/tasks/shared/types';
import { installLocalStorageMock } from './helpers/localStorage';

installLocalStorageMock();

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAssessment(accuracyScore: number, phonemes?: PhonemeAssessment['phonemes']): PhonemeAssessment {
  return {
    accuracyScore,
    phonemes: phonemes ?? [
      { phoneme: 'ɹ', accuracyScore: 40 },
      { phoneme: 't', accuracyScore: 90 },
    ],
  };
}

// ---------------------------------------------------------------------------
// getWordStats / getPhonemeStats — empty state
// ---------------------------------------------------------------------------

describe('getWordStats', () => {
  it('returns empty object when localStorage is empty', () => {
    expect(getWordStats()).toEqual({});
  });

  it('returns empty object when stored JSON is corrupt', () => {
    localStorage.setItem('talkplay_word_stats', 'not-valid-json{{{');
    expect(getWordStats()).toEqual({});
  });
});

describe('getPhonemeStats', () => {
  it('returns empty object when localStorage is empty', () => {
    expect(getPhonemeStats()).toEqual({});
  });

  it('returns empty object when stored JSON is corrupt', () => {
    localStorage.setItem('talkplay_phoneme_stats', '{broken}');
    expect(getPhonemeStats()).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// recordAttempt — first attempt seeds EMA from the raw score
// ---------------------------------------------------------------------------

describe('recordAttempt — first attempt', () => {
  it('sets word ema equal to the accuracy score', () => {
    recordAttempt('treat', makeAssessment(80));
    expect(getWordStats()['treat'].ema).toBe(80);
    expect(getWordStats()['treat'].count).toBe(1);
  });

  it('sets phoneme ema equal to the phoneme accuracy score', () => {
    recordAttempt('treat', makeAssessment(80, [{ phoneme: 'ɹ', accuracyScore: 60 }]));
    expect(getPhonemeStats()['ɹ'].ema).toBe(60);
    expect(getPhonemeStats()['ɹ'].count).toBe(1);
  });

  it('lowercases the word key', () => {
    recordAttempt('TREAT', makeAssessment(70));
    expect(getWordStats()['treat']).toBeDefined();
    expect(getWordStats()['TREAT']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// recordAttempt — EMA updates on subsequent attempts
// ---------------------------------------------------------------------------

describe('recordAttempt — EMA convergence', () => {
  it('blends toward new score on second attempt', () => {
    recordAttempt('treat', makeAssessment(80));
    recordAttempt('treat', makeAssessment(40));
    const expected = 80 * (1 - EMA_ALPHA) + 40 * EMA_ALPHA;
    expect(getWordStats()['treat'].ema).toBeCloseTo(expected, 5);
    expect(getWordStats()['treat'].count).toBe(2);
  });

  it('increments count on each attempt', () => {
    recordAttempt('treat', makeAssessment(70));
    recordAttempt('treat', makeAssessment(75));
    recordAttempt('treat', makeAssessment(80));
    expect(getWordStats()['treat'].count).toBe(3);
  });

  it('tracks multiple words independently', () => {
    recordAttempt('treat', makeAssessment(90));
    recordAttempt('rabbit', makeAssessment(50));
    expect(getWordStats()['treat'].ema).toBe(90);
    expect(getWordStats()['rabbit'].ema).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// recordAttempt — phoneme EMA accumulates across words
// ---------------------------------------------------------------------------

describe('recordAttempt — phoneme EMA across words', () => {
  it('accumulates phoneme scores across different words sharing a phoneme', () => {
    recordAttempt('treat', makeAssessment(80, [{ phoneme: 'ɹ', accuracyScore: 60 }]));
    recordAttempt('rabbit', makeAssessment(70, [{ phoneme: 'ɹ', accuracyScore: 40 }]));
    const expected = 60 * (1 - EMA_ALPHA) + 40 * EMA_ALPHA;
    expect(getPhonemeStats()['ɹ'].ema).toBeCloseTo(expected, 5);
    expect(getPhonemeStats()['ɹ'].count).toBe(2);
  });

  it('records all phonemes from one assessment', () => {
    recordAttempt('treat', makeAssessment(80, [
      { phoneme: 'ɹ', accuracyScore: 60 },
      { phoneme: 't', accuracyScore: 95 },
    ]));
    expect(getPhonemeStats()['ɹ'].count).toBe(1);
    expect(getPhonemeStats()['t'].count).toBe(1);
  });
});
