import { resetTestEnv, restoreTestEnv, mockConfigWithEnv } from './tests-setup';

const { loadEnvReplacements } = await import('#src/load-env-replacements');

describe('loadEnvReplacements', () => {

  beforeEach(resetTestEnv);
  afterEach(restoreTestEnv);

  it('should provide replacement mappings for both process.env and import.meta.env', () => {

    mockConfigWithEnv({
      MIRTA_TEST: 'value',
      APP_PORT: '3000',
    });

    const replacements = loadEnvReplacements({ keepNodeEnv: false });

    expect(replacements).toEqual({
      'process.env.APP_PORT': '"3000"',
      'import.meta.env.APP_PORT': '"3000"',
      'process.env.MIRTA_TEST': '"value"',
      'import.meta.env.MIRTA_TEST': '"value"',
    });

  });

  it('should serialize values using JSON.stringify for safe injection', () => {

    mockConfigWithEnv({
      MIRTA_STRING: 'hello',
      APP_NUMBER: '123',
      APP_BOOL: 'true',
    });

    const replacements = loadEnvReplacements();

    expect(replacements['process.env.MIRTA_STRING']).toBe('"hello"');
    expect(replacements['process.env.APP_NUMBER']).toBe('"123"');
    expect(replacements['process.env.APP_BOOL']).toBe('"true"');

  });

  it('should properly escape JSON strings (e.g. backslashes, quotes)', () => {

    mockConfigWithEnv({
      MIRTA_JSON: '{"key":"value"}',
      APP_PATH: 'C:\\Users\\test',
    });

    const replacements = loadEnvReplacements();

    expect(replacements['process.env.MIRTA_JSON']).toBe('"{\\"key\\":\\"value\\"}"');
    expect(replacements['process.env.APP_PATH']).toBe('"C:\\\\Users\\\\test"');

  });

  it('should respect all loadEnv options when filtering and resolving variables', () => {

    mockConfigWithEnv({
      CUSTOM_VAR: 'test',
    });

    const replacements = loadEnvReplacements({
      mode: 'production',
      prefix: 'CUSTOM_',
      cwd: '/custom/path',
      keepNodeEnv: false,
    });

    expect(replacements).toHaveProperty('process.env.CUSTOM_VAR');
    expect(replacements).not.toHaveProperty('process.env.NODE_ENV');

  });

  it('should return empty replacements object when no environment variables are loaded', () => {

    const replacements = loadEnvReplacements({ keepNodeEnv: false });

    expect(replacements).toEqual({});

  });

  it('should apply default options correctly (prefixes, mode, cwd)', () => {

    mockConfigWithEnv({
      MIRTA_VAR: 'default',
    });

    const replacements = loadEnvReplacements();

    expect(replacements).toHaveProperty('process.env.MIRTA_VAR', '"default"');
    expect(replacements).toHaveProperty('import.meta.env.MIRTA_VAR', '"default"');

  });

});
