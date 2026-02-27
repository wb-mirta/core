import { ensureArray } from '@mirta/basics/array';
import { resetTestEnv, restoreTestEnv, mockDotenvxConfig, mockExistsSync, mockConfigWithEnv, expectConfigCalledWith } from './tests-setup';

const { loadEnv } = await import('#src/load-env');

describe('loadEnv', () => {

  beforeEach(resetTestEnv);
  afterEach(restoreTestEnv);

  describe('basic functionality', () => {

    it('should load environment variables from .env file', () => {

      mockExistsSync.mockReturnValue(true);

      mockConfigWithEnv({
        MIRTA_TEST: 'value1',
        APP_PORT: '3000',
      });

      const env = loadEnv({ cwd: '/test/project', keepNodeEnv: false });

      expect(env).toEqual({
        APP_PORT: '3000',
        MIRTA_TEST: 'value1',
      });

    });

    it('should use process.cwd() as default cwd', () => {

      mockExistsSync.mockReturnValue(true);

      mockConfigWithEnv({
        MIRTA_VALUE: 'test',
      });

      loadEnv();

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);

        expect(paths).toContain('/test/project/.env');

      });

    });

    it('should use process.env.NODE_ENV as default mode', () => {

      process.env.NODE_ENV = 'production';

      mockExistsSync.mockReturnValue(true);

      mockConfigWithEnv({
        MIRTA_TEST: 'production',
      });

      loadEnv();

      expectConfigCalledWith((config) => {

        expect(config.path).toEqual(
          expect.arrayContaining([
            expect.stringContaining('.env.production'),
          ])
        );

      });

    });

    it('should return empty object when no .env files are found', () => {

      mockExistsSync.mockReturnValue(false);

      const env = loadEnv({ cwd: '/test/project', keepNodeEnv: false });

      expect(env).toEqual({});
      expect(mockDotenvxConfig).not.toHaveBeenCalled();

    });

  });

  describe('prefix-based filtering', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true);

    });

    it('should include only environment variables matching default prefixes (MIRTA_, APP_)', () => {

      mockConfigWithEnv({
        MIRTA_TEST: 'value',
        APP_PORT: '3000',
        OTHER_VAR: 'ignored',
        RANDOM: 'ignored',
      });

      const env = loadEnv({ keepNodeEnv: false });

      expect(env).toEqual({
        APP_PORT: '3000',
        MIRTA_TEST: 'value',
      });

      expect(env).not.toHaveProperty('OTHER_VAR');
      expect(env).not.toHaveProperty('RANDOM');

    });

    it('should respect custom prefix when filtering environment variables', () => {

      mockConfigWithEnv({
        CUSTOM_VAR: 'included',
        MIRTA_TEST: 'excluded',
        APP_PORT: 'excluded',
      });

      const env = loadEnv({ prefix: 'CUSTOM_', keepNodeEnv: false });

      expect(env).toEqual({
        CUSTOM_VAR: 'included',
      });

    });

    it('should support multiple prefixes in array form', () => {

      mockConfigWithEnv({
        PREFIX1_VAR: 'included1',
        PREFIX2_VAR: 'included2',
        OTHER_VAR: 'excluded',
      });

      const env = loadEnv({ prefix: ['PREFIX1_', 'PREFIX2_'], keepNodeEnv: false });

      expect(env).toEqual({
        PREFIX1_VAR: 'included1',
        PREFIX2_VAR: 'included2',
      });

    });

    it('should exclude variables with undefined values', () => {

      mockConfigWithEnv({
        MIRTA_DEFINED: 'value',
        MIRTA_UNDEFINED: undefined as unknown as string,
      });

      const env = loadEnv({ keepNodeEnv: false });

      expect(env).toEqual({
        MIRTA_DEFINED: 'value',
      });

      expect(env).not.toHaveProperty('MIRTA_UNDEFINED');

    });

  });

  describe('mode-based file resolution', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true);

    });

    it('should load files in correct order for development', () => {

      loadEnv({ mode: 'development', cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.path).toEqual([
          '/app/.env.development.local',
          '/app/.env.development',
          '/app/.env.local',
          '/app/.env',
        ]);

      });

    });

    it('should exclude .local files in test mode', () => {

      loadEnv({ mode: 'test', cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.path).toEqual(['/app/.env.test', '/app/.env']);
        expect(config.path).not.toContain('/app/.env.test.local');
        expect(config.path).not.toContain('/app/.env.local');

      });

    });

    it('should load only base .env and .env.local file when mode is undefined', () => {

      delete process.env.NODE_ENV;

      loadEnv({ mode: undefined, cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.path).toEqual([
          '/app/.env.local',
          '/app/.env',
        ]);

      });

    });

    it('should resolve files correctly for custom modes (e.g. staging)', () => {

      loadEnv({ mode: 'staging', cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.path).toEqual([
          '/app/.env.staging.local',
          '/app/.env.staging',
          '/app/.env.local',
          '/app/.env',
        ]);

      });

    });

  });

  describe('file resolution order: cwd vs rootDir', () => {

    it('should prioritize files in cwd over rootDir', () => {

      mockExistsSync.mockReturnValue(true);

      loadEnv({
        mode: 'development',
        cwd: '/monorepo/packages/app',
        rootDir: '/monorepo',
      });

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);
        const cwdPaths = paths.filter(p => p.startsWith('/monorepo/packages/app'));
        const rootPaths = paths.filter(p => p.startsWith('/monorepo/') && !p.startsWith('/monorepo/packages/app'));

        expect(cwdPaths.length).toBeGreaterThan(0);
        expect(rootPaths.length).toBeGreaterThan(0);

        const lastCwdIndex = paths.lastIndexOf(cwdPaths[cwdPaths.length - 1]);
        const firstRootIndex = paths.indexOf(rootPaths[0]);

        expect(lastCwdIndex).toBeLessThan(firstRootIndex);

      });

    });

    it('should not resolve files in rootDir when not provided', () => {

      mockExistsSync.mockReturnValue(true);

      loadEnv({ mode: 'development', cwd: '/app' });

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);
        expect(paths.every(p => p.startsWith('/app'))).toBe(true);

      });

    });

    it('should avoid duplicate file entries when cwd equals rootDir', () => {

      mockExistsSync.mockReturnValue(true);

      loadEnv({
        mode: 'development',
        cwd: '/app',
        rootDir: '/app',
      });

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);
        expect(paths).toHaveLength(4);

      });

    });

    it('should only include existing .env files in result', () => {

      mockExistsSync.mockImplementation((path) => {

        return path === '/app/.env' || path === '/app/.env.development';

      });

      loadEnv({ mode: 'development', cwd: '/app' });

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);

        expect(paths).toEqual([
          '/app/.env.development',
          '/app/.env',
        ]);

      });

    });

  });

  describe('NODE_ENV handling and keepNodeEnv', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true);
      process.env.NODE_ENV = 'production';

    });

    it('should include NODE_ENV by default', () => {

      mockConfigWithEnv({
        MIRTA_TEST: 'value',
      });

      const env = loadEnv();

      expect(env).toHaveProperty('NODE_ENV', 'production');

    });

    it('should exclude NODE_ENV when keepNodeEnv is false', () => {

      mockConfigWithEnv({
        MIRTA_TEST: 'value',
      });

      const env = loadEnv({ keepNodeEnv: false });

      expect(env).not.toHaveProperty('NODE_ENV');
      expect(env).toHaveProperty('MIRTA_TEST');

    });

    it('should preserve NODE_ENV even when not matching prefix, if keepNodeEnv: true', () => {

      mockConfigWithEnv({
        CUSTOM_VAR: 'value',
      });

      const env = loadEnv({ prefix: 'CUSTOM_', keepNodeEnv: true });

      expect(env).toHaveProperty('NODE_ENV', 'production');
      expect(env).toHaveProperty('CUSTOM_VAR', 'value');

    });

  });

  describe('custom envFile configuration', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true);

    });

    it('should resolve custom envFile name (e.g. .env.custom)', () => {

      delete process.env.NODE_ENV;

      loadEnv({ envFile: '.env.custom', cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.path).toEqual([
          '/app/.env.custom.local',
          '/app/.env.custom',
        ]);

      });

    });

    it('should resolve mixed envFile entries (e.g. .env and .env.custom)', () => {

      loadEnv({ envFile: ['.env', '.env.custom'], cwd: '/app' });

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);
        expect(paths).toContain('/app/.env');
        expect(paths).toContain('/app/.env.custom');

      });

    });

    it('should deduplicate envFile array entries', () => {

      loadEnv({ envFile: ['.env', '.env', '.env'], cwd: '/app' });

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);
        const filtered = paths.filter(p => p === '/app/.env');
        expect(filtered).toHaveLength(1);

      });

    });

  });

  describe('duplicate file handling', () => {

    beforeEach(() => {

      vi.clearAllMocks();
      mockExistsSync.mockReturnValue(true);

    });

    it('should warn when envFile entries produce duplicate resolved files', () => {

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Suppress console output during test
      });

      loadEnv({
        mode: 'development',
        cwd: '/app',
        envFile: ['.env', '.env.local'],
      });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Redundant env file entry detected')
      );

      warn.mockRestore();

    });

    it('should prioritize longer envFile entries to ensure correct variant loading order', () => {

      loadEnv({
        mode: 'development',
        cwd: '/app',
        envFile: ['.env.custom', '.env'],
      });

      expectConfigCalledWith((config) => {

        const paths = ensureArray(config.path).map(String);
        const devLocal = paths.find(p => p === '/app/.env.development.local');
        const dev = paths.find(p => p === '/app/.env.development');

        expect(devLocal).toBeDefined();
        expect(dev).toBeDefined();

        if (!devLocal || !dev)
          return;

        expect(paths.indexOf(devLocal))
          .toBeLessThan(paths.indexOf(dev));

      });

    });

  });

  describe('dotenvx integration', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true);

    });

    it('should forward user-provided dotenv options to dotenvx.config', () => {

      loadEnv({
        cwd: '/app',
        dotenv: {
          encoding: 'utf16',
          debug: true,
          strict: true,
        },
      });

      expectConfigCalledWith((config) => {

        expect(config.encoding).toBe('utf16');
        expect(config.debug).toBe(true);
        expect(config.strict).toBe(true);

      });

    });

    it('should set default logLevel to "warn" unless overridden', () => {

      loadEnv({ cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.logLevel).toBe('warn');

      });

    });

    it('should suppress MISSING_ENV_FILE errors by default', () => {

      loadEnv({ cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.ignore).toEqual(['MISSING_ENV_FILE']);

      });

    });

    it('should use isolated processEnv to avoid mutating global process.env', () => {

      loadEnv({ cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.processEnv).toBeDefined();
        expect(config.processEnv).not.toBe(process.env);

      });

    });

    it('should disable dotenvx convention mode', () => {

      loadEnv({ cwd: '/app' });

      expectConfigCalledWith((config) => {

        expect(config.convention).toBeUndefined();

      });

    });

  });

  describe('environment variable sorting', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true);

    });

    it('should sort filtered env keys in lexicographical order', () => {

      mockConfigWithEnv({
        MIRTA_Z: 'z',
        APP_A: 'a',
        MIRTA_A: 'a',
        APP_Z: 'z',
      });

      const env = loadEnv({ keepNodeEnv: false });
      const keys = Object.keys(env);

      expect(keys).toEqual([
        'APP_A',
        'APP_Z',
        'MIRTA_A',
        'MIRTA_Z',
      ]);

    });

    it('should sort numeric string keys naturally (e.g. VAR1, VAR2, VAR10)', () => {

      mockConfigWithEnv({
        MIRTA_VAR10: '10',
        MIRTA_VAR2: '2',
        MIRTA_VAR1: '1',
      });

      const env = loadEnv({ keepNodeEnv: false });
      const keys = Object.keys(env);

      expect(keys).toEqual([
        'MIRTA_VAR1',
        'MIRTA_VAR2',
        'MIRTA_VAR10',
      ]);

    });

  });

});
