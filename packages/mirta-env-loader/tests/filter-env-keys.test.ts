// packages/mirta-env-loader/tests/filter-env-keys.test.ts
const { filterEnvKeys } = await import('#src/load-env')

describe('filterEnvKeys', () => {

  describe('prefix-based filtering', () => {

    it('should include only environment variables matching allowed prefixes', () => {

      const env = {
        MIRTA_TEST: 'value1',
        APP_PORT: '3000',
        OTHER_VAR: 'ignored',
        RANDOM: 'ignored',
      }

      const result = filterEnvKeys(env, ['MIRTA_', 'APP_'], true)

      expect(result).toEqual({
        APP_PORT: '3000',
        MIRTA_TEST: 'value1',
      })

    })

    it('should respect single prefix when filtering variables', () => {

      const env = {
        CUSTOM_VAR1: 'value1',
        CUSTOM_VAR2: 'value2',
        OTHER_VAR: 'ignored',
      }

      const result = filterEnvKeys(env, ['CUSTOM_'], false)

      expect(result).toEqual({
        CUSTOM_VAR1: 'value1',
        CUSTOM_VAR2: 'value2',
      })

    })

    it('should return empty object when no variables match any prefix', () => {

      const env = {
        OTHER_VAR: 'value',
        RANDOM: 'value',
      }

      const result = filterEnvKeys(env, ['MIRTA_', 'APP_'], false)

      expect(result).toEqual({})

    })

  })

  describe('NODE_ENV inclusion logic', () => {

    it('should include NODE_ENV if keepNodeEnv is true, regardless of prefixes', () => {

      const env = {
        NODE_ENV: 'production',
        MIRTA_TEST: 'value',
      }

      const result = filterEnvKeys(env, ['MIRTA_'], true)

      expect(result).toHaveProperty('NODE_ENV', 'production')

    })

    it('should exclude NODE_ENV when keepNodeEnv is false', () => {

      const env = {
        NODE_ENV: 'production',
        MIRTA_TEST: 'value',
      }

      const result = filterEnvKeys(env, ['MIRTA_'], false)

      expect(result).not.toHaveProperty('NODE_ENV')
      expect(result).toHaveProperty('MIRTA_TEST')

    })

    it('should preserve NODE_ENV even if it does not match any prefix, if keepNodeEnv: true', () => {

      const env = {
        NODE_ENV: 'development',
        OTHER_VAR: 'ignored',
      }

      const result = filterEnvKeys(env, ['MIRTA_'], true)

      expect(result).toEqual({
        NODE_ENV: 'development',
      })

    })

  })

  describe('filtering out undefined values', () => {

    it('should omit variables with undefined values from result', () => {

      const env = {
        MIRTA_DEFINED: 'value',
        MIRTA_UNDEFINED: undefined,
        APP_DEFINED: 'value',
        APP_UNDEFINED: undefined,
      }

      const result = filterEnvKeys(env, ['MIRTA_', 'APP_'], false)

      expect(result).toEqual({
        APP_DEFINED: 'value',
        MIRTA_DEFINED: 'value',
      })
      expect(result).not.toHaveProperty('MIRTA_UNDEFINED')
      expect(result).not.toHaveProperty('APP_UNDEFINED')

    })

    it('should exclude NODE_ENV when its value is undefined, even if keepNodeEnv: true', () => {

      const env = {
        NODE_ENV: undefined,
        MIRTA_TEST: 'value',
      }

      const result = filterEnvKeys(env, ['MIRTA_'], true)

      expect(result).not.toHaveProperty('NODE_ENV')

    })

  })

  describe('deterministic key ordering', () => {

    it('should sort keys in lexicographical order using localeCompare', () => {

      const env = {
        MIRTA_Z: 'z',
        APP_A: 'a',
        MIRTA_A: 'a',
        APP_Z: 'z',
        MIRTA_M: 'm',
      }

      const result = filterEnvKeys(env, ['MIRTA_', 'APP_'], false)
      const keys = Object.keys(result)

      expect(keys).toEqual(['APP_A', 'APP_Z', 'MIRTA_A', 'MIRTA_M', 'MIRTA_Z'])

    })

    it('should sort numeric substrings naturally (e.g. VAR1, VAR2, VAR10)', () => {

      const env = {
        MIRTA_VAR10: '10',
        MIRTA_VAR2: '2',
        MIRTA_VAR1: '1',
        MIRTA_VAR20: '20',
      }

      const result = filterEnvKeys(env, ['MIRTA_'], false)
      const keys = Object.keys(result)

      expect(keys).toEqual(['MIRTA_VAR1', 'MIRTA_VAR2', 'MIRTA_VAR10', 'MIRTA_VAR20'])

    })

    it('should produce consistent key order across multiple calls', () => {

      const env = {
        MIRTA_C: 'c',
        MIRTA_A: 'a',
        MIRTA_B: 'b',
      }

      const result1 = filterEnvKeys(env, ['MIRTA_'], false)
      const result2 = filterEnvKeys(env, ['MIRTA_'], false)

      expect(Object.keys(result1)).toEqual(Object.keys(result2))

    })

  })

  describe('edge case handling', () => {

    it('should return empty object when input environment is empty', () => {

      const result = filterEnvKeys({}, ['MIRTA_'], false)

      expect(result).toEqual({})

    })

    it('should return empty object when no prefixes are allowed', () => {

      const env = {
        MIRTA_TEST: 'value',
        APP_PORT: '3000',
      }

      const result = filterEnvKeys(env, [], false)

      expect(result).toEqual({})

    })

    it('should treat prefix as plain string start, even if not ending with underscore', () => {

      const env = {
        CUSTOM: 'exact',
        CUSTOMVAR: 'prefix',
        OTHER: 'ignored',
      }

      const result = filterEnvKeys(env, ['CUSTOM'], false)

      expect(result).toEqual({
        CUSTOM: 'exact',
        CUSTOMVAR: 'prefix',
      })

    })

    it('should perform case-sensitive prefix matching (e.g. MIRTA_ ≠ mirta_)', () => {

      const env = {
        MIRTA_TEST: 'uppercase',
        mirta_test: 'lowercase',
        Mirta_Test: 'mixed',
      }

      const result = filterEnvKeys(env, ['MIRTA_'], false)

      expect(result).toEqual({
        MIRTA_TEST: 'uppercase',
      })

    })

  })

})
