import { damerauLevenshtein } from '#src/fuzzy/distance/damerau-levenshtein';

describe('damerauLevenshtein', () => {

  describe('identical strings', () => {

    it('should return zero distance for identical strings', () => {

      const result = damerauLevenshtein('test', 'test');
      expect(result.steps).toBe(0);
      expect(result.relative).toBe(0);
      expect(result.similarity).toBe(1);

    });

    it('should return zero distance for empty strings', () => {

      const result = damerauLevenshtein('', '');
      expect(result.steps).toBe(0);
      expect(result.relative).toBe(0);
      expect(result.similarity).toBe(1);

    });

  });

  describe('single character operations', () => {

    it('should calculate insertion distance', () => {

      const result = damerauLevenshtein('test', 'tests');
      expect(result.steps).toBe(1);
      expect(result.relative).toBeCloseTo(0.2); // 1/5
      expect(result.similarity).toBeCloseTo(0.8);

    });

    it('should calculate deletion distance', () => {

      const result = damerauLevenshtein('tests', 'test');
      expect(result.steps).toBe(1);
      expect(result.relative).toBeCloseTo(0.2); // 1/5
      expect(result.similarity).toBeCloseTo(0.8);

    });

    it('should calculate substitution distance', () => {

      const result = damerauLevenshtein('test', 'best');
      expect(result.steps).toBe(1);
      expect(result.relative).toBe(0.25); // 1/4
      expect(result.similarity).toBe(0.75);

    });

    it('should calculate transposition distance', () => {

      const result = damerauLevenshtein('test', 'tset');
      expect(result.steps).toBe(1); // transposition is single operation
      expect(result.relative).toBe(0.25); // 1/4
      expect(result.similarity).toBe(0.75);

    });

  });

  describe('multiple operations', () => {

    it('should handle combination of operations', () => {

      const result = damerauLevenshtein('release', 'releas');
      expect(result.steps).toBe(1); // deletion of 'e'
      expect(result.relative).toBeCloseTo(0.143, 2); // 1/7
      expect(result.similarity).toBeCloseTo(0.857, 2);

    });

    it('should prefer transposition over substitutions', () => {

      const result = damerauLevenshtein('ab', 'ba');
      expect(result.steps).toBe(1); // transposition, not 2 substitutions

    });

  });

  describe('maxDistance parameter', () => {

    it('should return steps up to maxDistance', () => {

      const result = damerauLevenshtein('test', 'best', 2);
      expect(result.steps).toBe(1);
      expect(result.steps).toBeLessThanOrEqual(2);

    });

    it('should return Infinity when distance exceeds maxDistance', () => {

      const result = damerauLevenshtein('abc', 'xyz', 2);

      expect(result.steps).toBe(Infinity);
      expect(result.relative).toBe(Infinity);
      expect(result.similarity).toBe(-Infinity);

    });

    it('should optimize with early exit on length difference', () => {

      const result = damerauLevenshtein('a', 'abcdef', 2);
      expect(result.steps).toBe(Infinity);

    });

    it('should return Infinity when maxDistance is 0 and strings differ', () => {

      const result = damerauLevenshtein('a', 'b', 0);
      expect(result.steps).toBe(Infinity);

    });

    it('should return zero when maxDistance is 0 and strings are identical', () => {

      const result = damerauLevenshtein('a', 'a', 0);
      expect(result.steps).toBe(0);
      expect(result.similarity).toBe(1);

    });

    it('should return exact distance when within maxDistance', () => {

      const result = damerauLevenshtein('abc', 'axc', 2);
      expect(result.steps).toBe(1);

    });

    it('should handle transposition within maxDistance of 1', () => {

      const result = damerauLevenshtein('ab', 'ba', 1);
      expect(result.steps).toBe(1);

    });

    it('should return Infinity for transposition when maxDistance is 0', () => {

      const result = damerauLevenshtein('ab', 'ba', 0);
      expect(result.steps).toBe(Infinity);

    });

    it('should handle unicode with maxDistance', () => {

      expect(damerauLevenshtein('café', 'cafe', 1).steps).toBe(1);
      expect(damerauLevenshtein('привет', 'привт', 1).steps).toBe(1);
      expect(damerauLevenshtein('привет', 'здравствуй', 2).steps).toBe(Infinity);

    });

    it('should early exit when length difference exceeds maxDistance', () => {

      expect(damerauLevenshtein('a', 'longstring', 2).steps).toBe(Infinity);

    });

  });

  describe('input safety', () => {

    it('should return Infinity for strings exceeding input length threshold', () => {

      const longString = 'a'.repeat(600);
      const result = damerauLevenshtein(longString, 'test');
      expect(result.steps).toBe(Infinity);

    });

  });

  describe('edge cases', () => {

    it('should handle empty source string', () => {

      const result = damerauLevenshtein('', 'test');
      expect(result.steps).toBe(4);
      expect(result.relative).toBe(1);
      expect(result.similarity).toBe(0);

    });

    it('should handle empty target string', () => {

      const result = damerauLevenshtein('test', '');
      expect(result.steps).toBe(4);
      expect(result.relative).toBe(1);
      expect(result.similarity).toBe(0);

    });

    it('should handle unicode characters', () => {

      const result = damerauLevenshtein('тест', 'test');
      expect(result.steps).toBeGreaterThan(0);

    });

  });

  describe('real-world CLI scenarios', () => {

    it('should detect typos in command names', () => {

      const result = damerauLevenshtein('releas', 'release');
      expect(result.steps).toBe(1);

    });

    it('should detect transposed characters', () => {

      const result = damerauLevenshtein('pubilsh', 'publish');
      expect(result.steps).toBe(1); // transposition of 'i' and 'l'

    });

    it('should handle case-sensitive comparison', () => {

      const result = damerauLevenshtein('Release', 'release');
      expect(result.steps).toBe(1); // substitution R -> r

    });

  });

});
