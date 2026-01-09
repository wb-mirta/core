import {
  toValidPackageName,
  hasValidFormat
} from '#package/resolver'

// Mock dependencies
vi.mock('#utils/prompts', () => ({
  prompts: vi.fn(),
}))

vi.mock('#i18n', () => ({
  t: (key: string) => key, // Simplified translation mock
}))

vi.mock('#utils/logger', () => ({
  logger: {
    step: vi.fn(),
  },
}))

describe('resolver', () => {

  describe('toValidPackageName', () => {

    it('should convert simple name to lowercase with hyphens', () => {

      expect(toValidPackageName('My Module')).toBe('my-module')

    })

    it('should trim whitespace', () => {

      expect(toValidPackageName('  hello world  ')).toBe('hello-world')

    })

    it('should remove leading dots and underscores', () => {

      expect(toValidPackageName('..my-module')).toBe('my-module')
      expect(toValidPackageName('__my-module')).toBe('my-module')

    })

    it('should remove trailing dots and underscores', () => {

      expect(toValidPackageName('my-module..')).toBe('my-module')
      expect(toValidPackageName('my-module__')).toBe('my-module')

    })

    it('should replace invalid chars with hyphens', () => {

      expect(toValidPackageName('my@module!')).toBe('my-module')

    })

    it('should collapse multiple hyphens', () => {

      expect(toValidPackageName('my---module')).toBe('my-module')
      expect(toValidPackageName('my_-_module')).toBe('my-module')

    })

    it('should handle scoped package names', () => {

      expect(toValidPackageName('@My Org/My Module!')).toBe('@my-org/my-module')

    })

    it('should sanitize scope and name separately', () => {

      expect(toValidPackageName('@Scope.Sub/Tool_1')).toBe('@scope-sub/tool-1')

    })

    it('should handle single character scope and name', () => {

      expect(toValidPackageName('@a/b')).toBe('@a/b')

    })

    it('should return empty string result as empty', () => {

      expect(toValidPackageName('....')).toBe('')

    })

  })

  describe('hasValidFormat', () => {

    it('should accept valid unscoped names', () => {

      expect(hasValidFormat('my-package')).toBe(true)
      expect(hasValidFormat('module123')).toBe(true)
      expect(hasValidFormat('a')).toBe(true)

    })

    it('should reject invalid unscoped names', () => {

      expect(hasValidFormat('my package')).toBe(false)
      expect(hasValidFormat('my/package')).toBe(false)
      expect(hasValidFormat('')).toBe(false)
      expect(hasValidFormat('.my-package')).toBe(false)

    })

    it('should accept valid scoped names', () => {

      expect(hasValidFormat('@scope/my-package')).toBe(true)
      expect(hasValidFormat('@myorg/module')).toBe(true)

    })

    it('should reject invalid scoped names', () => {

      expect(hasValidFormat('@scope/')).toBe(false)
      expect(hasValidFormat('@scope')).toBe(false)
      expect(hasValidFormat('@scope/my package')).toBe(false)
      expect(hasValidFormat('@scope/пакет')).toBe(false) // Cyrillic

    })

  })

  describe('Edge case: @+/+', () => {

    it('should reject "@+/+" as invalid package name', () => {

      expect(hasValidFormat('@+/+')).toBe(false)

    })

    it('should sanitize "@+/+" into a valid scoped-like form', () => {

      expect(toValidPackageName('@+/+')).toBe('')

    })

    it('should handle empty result after sanitization gracefully', () => {

      // Случай, когда и scope, и name очищаются до пустоты
      expect(toValidPackageName('@.../___')).toBe('')

    })

  })

})
