import { getPluralForm } from '#src/translator'
import type { Lang } from '#src/types'

describe('getPluralForm', () => {

  const en = 'en' as Lang
  const ru = 'ru' as Lang

  describe('en-US', () => {

    it('should return "one" for 1', () => {

      expect(getPluralForm(en, 1)).toBe('one')

    })

    it('should return "other" for 0, 2, 5', () => {

      expect(getPluralForm(en, 0)).toBe('other')
      expect(getPluralForm(en, 2)).toBe('other')
      expect(getPluralForm(en, 5)).toBe('other')

    })

  })

  describe('ru-RU', () => {

    it('should return "one" for 1, 21, 31', () => {

      expect(getPluralForm(ru, 1)).toBe('one')
      expect(getPluralForm(ru, 21)).toBe('one')
      expect(getPluralForm(ru, 31)).toBe('one')

    })

    it('should return "few" for 2, 3, 4, 22, 23, 24', () => {

      expect(getPluralForm(ru, 2)).toBe('few')
      expect(getPluralForm(ru, 3)).toBe('few')
      expect(getPluralForm(ru, 4)).toBe('few')
      expect(getPluralForm(ru, 22)).toBe('few')
      expect(getPluralForm(ru, 23)).toBe('few')
      expect(getPluralForm(ru, 24)).toBe('few')

    })

    it('should return "many" for 0, 5, 11, 15, 25', () => {

      expect(getPluralForm(ru, 0)).toBe('many')
      expect(getPluralForm(ru, 5)).toBe('many')
      expect(getPluralForm(ru, 11)).toBe('many')
      expect(getPluralForm(ru, 15)).toBe('many')
      expect(getPluralForm(ru, 25)).toBe('many')

    })

  })

})
