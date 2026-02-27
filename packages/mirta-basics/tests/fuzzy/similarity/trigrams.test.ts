import { trigramSimilarity } from '#src/fuzzy/similarity/trigrams/index';
import { describe, it, expect } from 'vitest';

describe('trigramSimilarity', () => {

  describe('should return 1 for identical strings', () => {

    it('should return 1 for same word', () => {

      expect(trigramSimilarity('hello', 'hello')).toBe(1);

    });

    it('should return 1 for same short word', () => {

      expect(trigramSimilarity('hi', 'hi')).toBe(1);

    });

    it('should return 1 for same single char', () => {

      expect(trigramSimilarity('a', 'a')).toBe(1);

    });

  });

  describe('should return 0 for completely different strings', () => {

    it('should return 0 for no common trigrams', () => {

      expect(trigramSimilarity('aaa', 'bbb')).toBe(0);

    });

    it('should return 0 for empty and non-empty', () => {

      expect(trigramSimilarity('', 'abc')).toBe(0);
      expect(trigramSimilarity('abc', '')).toBe(0);

    });

    it('should return 0 for both empty', () => {

      expect(trigramSimilarity('', '')).toBe(0);

    });

  });

  describe('should handle short strings', () => {

    it('should calculate similarity for "ab" and "abc"', () => {

      // ab   -> __a, _ab, ab_, b__
      // abc  -> __a, _ab, abc, bc_, c__
      // intersection: __a, _ab → 2
      // union: __a, _ab, ab_, b__, abc, bc_, c__ → 7
      expect(trigramSimilarity('ab', 'abc')).toBeCloseTo(2 / 7);

    });

    it('should calculate similarity for "a" and "ab"', () => {

      // a  -> __a, _a_, a__
      // ab -> __a, _ab, ab_, b__
      // intersection: __a → 1
      // union: __a, _a_, a__, _ab, ab_, b__ → 6
      expect(trigramSimilarity('a', 'ab')).toBeCloseTo(1 / 6);

    });

  });

  describe('should be symmetric', () => {

    it('should return same result for swapped args', () => {

      const a = 'publish';
      const b = 'pablis';
      expect(trigramSimilarity(a, b)).toBe(trigramSimilarity(b, a));

    });

  });

  describe('should detect high similarity for similar words', () => {

    it('should return high score for publish and publsh', () => {

      expect(trigramSimilarity('publish', 'publsh')).toBeGreaterThan(0.5);

    });

    it('should return high score for включи and выключи', () => {

      // Важно: несмотря на одинаковую фонетику — триграммы различаются
      expect(trigramSimilarity('включи', 'выключи')).toBeGreaterThan(0.5);

    });

    it('should return low score for release and ruleez', () => {

      expect(trigramSimilarity('release', 'ruleez')).toBeLessThan(0.1);

    });

  });

  describe('should detect low similarity for unrelated words', () => {

    it('should return low score for publish and build', () => {

      expect(trigramSimilarity('publish', 'build')).toBeLessThan(0.3);

    });

    it('should return low score for cat and dog', () => {

      expect(trigramSimilarity('cat', 'dog')).toBe(0);

    });

  });

  describe('should be case-insensitive', () => {

    it('should return same score for different cases', () => {

      expect(trigramSimilarity('Publish', 'publish')).toBe(1);
      expect(trigramSimilarity('PUBlish', 'pUbLiSh')).toBeGreaterThan(0.8);

    });

  });

  describe('should handle whitespace and padding', () => {

    it('should treat spaces as part of the word', () => {

      expect(trigramSimilarity('hello world', 'helloworld')).toBeLessThan(1);

    });

  });

});
