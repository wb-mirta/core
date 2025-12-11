// packages/mirta-basics/tests/fuzzy/phonetics/daitch-mokotoff-lite.test.ts

import { daitchMokotoffLite } from '#src/fuzzy/phonetics/daitch-mokotoff/index'

describe('daitchMokotoffLite', () => {

  describe('should return 000000 for empty or invalid input', () => {

    it('should return 000000 for empty string', () => {

      expect(daitchMokotoffLite('')).toBe('000000')

    })

    it('should return 000000 for null', () => {

      expect(daitchMokotoffLite(null as unknown as string)).toBe('000000')

    })

    it('should return 000000 for undefined', () => {

      expect(daitchMokotoffLite(undefined as unknown as string)).toBe('000000')

    })

  })

  describe('should produce hash 778400 (P-B-L-SH)', () => {

    it('should encode publish as 778400', () => {

      expect(daitchMokotoffLite('publish')).toBe('778400')

    })

    it('should encode публиш as 778400', () => {

      expect(daitchMokotoffLite('публиш')).toBe('778400')

    })

    it('should encode паблиш as 778400', () => {

      expect(daitchMokotoffLite('паблиш')).toBe('778400')

    })

    it('should encode puplish (typo) as 778400', () => {

      expect(daitchMokotoffLite('puplish')).toBe('778400')

    })

    it('should encode publsh (missing i) as 778400', () => {

      expect(daitchMokotoffLite('publsh')).toBe('778400')

    })

    it('should encode pablis (phonetic spelling) as 778400', () => {

      expect(daitchMokotoffLite('pablis')).toBe('778400')

    })

    it('should be case-insensitive for publish variants', () => {

      expect(daitchMokotoffLite('PuBlIsH')).toBe('778400')

    })

  })

  describe('should produce hash 984000 (R-L-S)', () => {

    it('should encode release as 984000', () => {

      expect(daitchMokotoffLite('release')).toBe('984000')

    })

    it('should encode релиз as 984000', () => {

      expect(daitchMokotoffLite('релиз')).toBe('984000')

    })

    it('should encode ruleez (phonetic spelling) as 984000', () => {

      expect(daitchMokotoffLite('ruleez')).toBe('984000')

    })

    it('should be case-insensitive for release variants', () => {

      expect(daitchMokotoffLite('ReLeaSe')).toBe('984000')

    })

  })

  describe('should produce hash 783000 (B-L-D)', () => {

    it('should encode build as 783000', () => {

      expect(daitchMokotoffLite('build')).toBe('783000')

    })

    it('should encode биулд as 783000', () => {

      expect(daitchMokotoffLite('биулд')).toBe('783000')

    })

  })

  describe('should produce hash 593000 (K-R-T)', () => {

    it('should encode create as 593000', () => {

      expect(daitchMokotoffLite('create')).toBe('593000')

    })

  })

  describe('should produce hash 676960 (N-P-M R-N)', () => {

    it('should encode npm run as 676960', () => {

      expect(daitchMokotoffLite('npm run')).toBe('676960')

    })

  })

  describe('should produce hash 056954 (I-N-G-K-S)', () => {

    it('should encode ignoreCase as 056954', () => {

      expect(daitchMokotoffLite('IGNORECASE')).toBe('056954')

    })

  })

  describe('should produce hash 478300 (S-B-L-D)', () => {

    it('should encode subbuild as 478300', () => {

      expect(daitchMokotoffLite('subbuild')).toBe('478300')

    })

  })

  describe('should produce hash 454000 (S-K-S)', () => {

    it('should encode success as 454000', () => {

      expect(daitchMokotoffLite('success')).toBe('454000')

    })

  })

  describe('should produce hash 550000 (K-V-K)', () => {

    it('should encode quick as 550000', () => {

      expect(daitchMokotoffLite('quick')).toBe('550000')

    })

    it('should encode kvik as 575000', () => {

      expect(daitchMokotoffLite('kvik')).toBe('575000')

    })

  })

  describe('should produce hash 430000 (SH-T or CH-T)', () => {

    it('should encode щит as 430000', () => {

      expect(daitchMokotoffLite('щит')).toBe('430000')

    })

    it('should encode chat as 530000', () => {

      expect(daitchMokotoffLite('chat')).toBe('530000')

    })

    it('should encode thing as 365000', () => {

      expect(daitchMokotoffLite('thing')).toBe('365000')

    })

  })

  describe('should produce hash 530000 (K-T or CH-T)', () => {

    it('should encode cat as 530000', () => {

      expect(daitchMokotoffLite('cat')).toBe('530000')

    })

    it('should encode код as 530000', () => {

      expect(daitchMokotoffLite('код')).toBe('530000')

    })

  })

  describe('should produce hash 550000 (K-H-K)', () => {

    it('should encode хак as 550000', () => {

      expect(daitchMokotoffLite('хак')).toBe('550000')

    })

  })

  describe('should produce hash 496800 (ZH-R-N-L)', () => {

    it('should encode журнал as 496800', () => {

      expect(daitchMokotoffLite('журнал')).toBe('496800')

    })

  })

  describe('should produce hash 445000 (CH-A-SH-K)', () => {

    it('should encode чашка as 445000', () => {

      expect(daitchMokotoffLite('чашка')).toBe('445000')

    })

  })

  describe('should handle silent h and digraphs', () => {

    it('should encode theme as 360000 (th → t, silent h)', () => {

      expect(daitchMokotoffLite('theme')).toBe('360000')

    })

    it('should encode phoenix as 765400 (ph → f, silent h)', () => {

      expect(daitchMokotoffLite('phoenix')).toBe('765400')

    })

  })

  describe('should truncate long input to 6 digits', () => {

    it('should encode long string as 075375', () => {

      const long = 'abcdefghijklmnopqrstuvwxyz'
      expect(daitchMokotoffLite(long)).toBe('075375')

    })

  })

})
