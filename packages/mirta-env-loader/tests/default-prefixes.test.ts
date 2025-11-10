// packages/mirta-env-loader/tests/default-prefixes.test.ts
const { DEFAULT_ENV_PREFIXES } = await import('#src/load-env')

describe('DEFAULT_ENV_PREFIXES', () => {

  it('should include MIRTA_ prefix for framework-specific variables', () => {

    expect(DEFAULT_ENV_PREFIXES).toContain('MIRTA_')

  })

  it('should include APP_ prefix for user-defined application variables', () => {

    expect(DEFAULT_ENV_PREFIXES).toContain('APP_')

  })

  it('should contain exactly two prefixes', () => {

    expect(DEFAULT_ENV_PREFIXES).toHaveLength(2)

  })

})
