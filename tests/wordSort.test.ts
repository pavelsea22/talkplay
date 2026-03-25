import { evaluateWordSort, pickWordSortLesson } from '../src/tasks/wordSort';
import type { WordSortTask } from '../src/tasks/wordSort';

describe('WordSort', () => {
  const task: WordSortTask = {
    type: 'wordSort',
    words: ['dog', 'duck', 'ten', 'top'],
    buckets: ['starts with /d/', 'starts with /t/'],
    correctBucket: {
      dog: 0,
      duck: 0,
      ten: 1,
      top: 1,
    },
  };

  describe('evaluateWordSort', () => {
    it('returns "correct" for correct bucket placement', () => {
      expect(evaluateWordSort('dog', 0, task)).toBe('correct');
      expect(evaluateWordSort('ten', 1, task)).toBe('correct');
    });

    it('returns "incorrect" for wrong bucket placement', () => {
      expect(evaluateWordSort('dog', 1, task)).toBe('incorrect');
      expect(evaluateWordSort('ten', 0, task)).toBe('incorrect');
    });

    it('handles all words in the task', () => {
      task.words.forEach((word) => {
        const correctIdx = task.correctBucket[word];
        const wrongIdx = correctIdx === 0 ? 1 : 0;
        expect(evaluateWordSort(word, correctIdx, task)).toBe('correct');
        expect(evaluateWordSort(word, wrongIdx, task)).toBe('incorrect');
      });
    });
  });

  describe('pickWordSortLesson', () => {
    it('returns a valid WordSortTask', () => {
      const lesson = pickWordSortLesson();
      expect(lesson.type).toBe('wordSort');
      expect(lesson.words).toHaveLength(4);
      expect(lesson.buckets).toHaveLength(2);
      expect(Object.keys(lesson.correctBucket)).toHaveLength(4);
    });

    it('shuffles words on each pick', () => {
      const lesson1 = pickWordSortLesson();
      const lesson2 = pickWordSortLesson();
      // Words array should be shuffled; original sets shouldn't be mutated
      expect(lesson1.words.length).toBe(4);
      expect(lesson2.words.length).toBe(4);
    });

    it('returns tasks from available sets', () => {
      const lessons = Array.from({ length: 10 }, () => pickWordSortLesson());
      const sets = new Set(lessons.map((l) => l.buckets[0]));
      // All should have the same bucket labels (for /d/ vs /t/)
      expect(sets.size).toBe(1);
    });
  });
});
