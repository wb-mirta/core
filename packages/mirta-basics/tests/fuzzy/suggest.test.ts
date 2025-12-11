import { suggestClosest } from '#src/fuzzy/suggest'

describe('suggestClosest', () => {

  describe('exact matches', () => {

    const commands = ['release', 'publish', 'build'] as const

    it('should return exact match', () => {

      const result = suggestClosest('release', commands)
      expect(result).toBe('release')

    })

    it('should return undefined for no match', () => {

      const result = suggestClosest('unknown-command-xyz', commands)
      expect(result).toBeUndefined()

    })

  })

  describe('close matches', () => {

    const commands = ['release', 'publish', 'build']

    it('should suggest closest match with single character typo', () => {

      expect(suggestClosest('releas', commands)).toBe('release')

    })

    it('should suggest closest match with transposition', () => {

      expect(suggestClosest('pubilsh', commands)).toBe('publish')

    })

    it('should suggest closest match with substitution', () => {

      expect(suggestClosest('releace', commands)).toBe('release')

    })

  })

  describe('maxDistance option', () => {

    const commands = ['release', 'publish', 'build']

    it('should use default maxDistance of 2', () => {

      const result = suggestClosest('rel', commands)
      expect(result).toBeUndefined() // расстояние = 3

    })

    it('should respect custom maxDistance', () => {

      const result = suggestClosest('rel', commands, { maxDistance: 5 })
      expect(result).toBe('release')

    })

    it('should return undefined when exceeding maxDistance', () => {

      const result = suggestClosest('xyz', commands, { maxDistance: 1 })
      expect(result).toBeUndefined()

    })

  })

  describe('multiple candidates', () => {

    it('should return closest match among multiple candidates', () => {

      const result = suggestClosest('buildd', ['build', 'release'])
      expect(result).toBe('build')

    })

    it('should prefer shorter distance', () => {

      const options = ['test', 'testing', 'tested']
      const result = suggestClosest('tes', options)
      expect(result).toBe('test')

    })

    it('should return first match when distances are equal', () => {

      const options = ['abc', 'xyz']
      const result = suggestClosest('ab', options, { maxDistance: 5 })
      expect(result).toBe('abc')

    })

  })

  describe('edge cases', () => {

    it('should handle empty input', () => {

      const result = suggestClosest('', ['test'])
      expect(result).toBeUndefined()

    })

    it('should handle empty candidates array', () => {

      const result = suggestClosest('test', [])
      expect(result).toBeUndefined()

    })

    it('should handle single candidate', () => {

      const result = suggestClosest('releas', ['release'])
      expect(result).toBe('release')

    })

  })

  describe('real-world CLI scenarios', () => {

    const cliCommands = ['release', 'publish', 'build', 'test', 'dev']

    it('should handle abbreviations within maxDistance', () => {

      expect(suggestClosest('pub', cliCommands, { maxDistance: 4 })).toBe('publish')

    })

    it('should suggest for common typos', () => {

      expect(suggestClosest('relase', cliCommands)).toBe('release')
      expect(suggestClosest('pubish', cliCommands)).toBe('publish')
      expect(suggestClosest('biuld', cliCommands)).toBe('build')

    })

    it('should not suggest for completely different input', () => {

      expect(suggestClosest('completely-different', cliCommands)).toBeUndefined()

    })

  })

  describe('Russian language & phonetics', () => {

    const commands = ['включи', 'выключи']

    it('should match "выключи" for phonetic typo "виключи"', () => {

      expect(suggestClosest('виключи', commands)).toBe('выключи')

    })

    it('should match "выключи" for shortened "викучи"', () => {

      expect(suggestClosest('викучи', commands)).toBe('выключи')

    })

    it('should handle layout mix: "выклuchi"', () => {

      expect(suggestClosest('выклuchi', commands)).toBe('выключи')

    })

    it('should match "включи" for sound substitution "вклюшы"', () => {

      expect(suggestClosest('вклюшы', commands)).toBe('включи')

    })

    it('should prefer "выключи" over "включи" for "виключи"', () => {

      expect(suggestClosest('виключи', commands)).toBe('выключи')

    })

    it('should NOT match "рулиска" to release with low maxDistance', () => {

      const result = suggestClosest('рулиска', ['release', 'publish'], {
        maxDistance: 2,
        weights: { phonetic: 0.8, trigram: 0.1, levenshtein: 0.1 },
      })

      expect(result).toBeUndefined()

    })

  })

  describe('Mixed RU/EN input', () => {

    it('should handle mixed "pabl" → "publish"', () => {

      const commands = ['publish', 'release']
      expect(suggestClosest('pаbl', commands, { maxDistance: 4 })).toBe('publish')

    })

  })

  describe('Transliterated input', () => {

    it('should match "релиз" → "release"', () => {

      const commands = ['release', 'publish']
      expect(suggestClosest('релиз', commands, { maxDistance: 4 })).toBe('release')

    })

    it('should match "пабл" → "publish"', () => {

      const commands = ['publish', 'build']
      expect(suggestClosest('пабл', commands, { maxDistance: 4 })).toBe('publish')

    })

  })

  describe('weights option', () => {

    it('should prioritize phonetic match when phonetic weight is high', () => {

      const commands = ['включи', 'выключи']
      const result = suggestClosest('виключи', commands, {
        weights: { phonetic: 0.9, trigram: 0.05, levenshtein: 0.05 },
        maxDistance: 3,
      })
      expect(result).toBe('выключи')

    })

    it('should fall back to trigram when phonetic weight is zero', () => {

      const commands = ['release', 'build']
      const result = suggestClosest('releas', commands, {
        weights: { phonetic: 0, trigram: 1, levenshtein: 0 },
      })
      expect(result).toBe('release')

    })

    it('should handle zero total weight gracefully', () => {

      const result = suggestClosest('test', ['test'], {
        weights: { phonetic: 0, trigram: 0, levenshtein: 0 },
      })
      expect(result).toBe('test')

    })

  })

  describe('special characters and normalization', () => {

    it('should handle hyphens and underscores', () => {

      const commands = ['my-command', 'my_command']
      expect(suggestClosest('my-command', commands)).toBe('my-command')
      expect(suggestClosest('my_command', commands)).toBe('my_command')

    })

    it('should handle Unicode and case folding', () => {

      const commands = ['café', 'résumé']
      expect(suggestClosest('cafe', commands)).toBe('café')
      expect(suggestClosest('resume', commands)).toBe('résumé')

    })

    it('should handle mixed symbols and numbers', () => {

      const commands = ['v1.0.0', 'build-2024']
      expect(suggestClosest('v1.0', commands)).toBe('v1.0.0')
      expect(suggestClosest('build2024', commands)).toBe('build-2024')

    })

  })

  describe('performance and ranking', () => {

    it('should only consider top 10 by trigram score', () => {

      const good = 'target'
      const similar = Array.from({ length: 100 }, (_, i) => `targ${i}`)
      const commands = [good, ...similar]

      const result = suggestClosest('target', commands)
      expect(result).toBe('target')

    })

  })

})
