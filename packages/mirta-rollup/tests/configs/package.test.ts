import { ensureArray } from '@mirta/basics/array';
import nodePath from 'node:path';

vi.mock('@mirta/package', async () => {

  const actual = await vi.importActual<typeof import('@mirta/package')>('@mirta/package');

  return {
    ...actual,
    readPackage: vi.fn(),
  };

});

vi.mock('@rollup/plugin-typescript', () => ({
  default: vi.fn(() => ({ name: 'typescript' })),
}));

vi.mock('@rollup/plugin-node-resolve', () => ({
  default: vi.fn(() => ({ name: 'node-resolve' })),
}));

vi.mock('@rollup/plugin-commonjs', () => ({
  default: vi.fn(() => ({ name: 'commonjs' })),
}));

vi.mock('@rollup/plugin-replace', () => ({
  default: vi.fn(() => ({ name: 'replace' })),
}));

vi.mock('rollup-plugin-copy', () => ({
  default: vi.fn(() => ({ name: 'copy' })),
}));

vi.mock('rollup-plugin-dts', () => ({
  default: vi.fn(() => ({ name: 'dts' })),
}));

vi.mock('#plugins/del', () => ({
  default: vi.fn(() => ({ name: 'del' })),
}));

vi.mock('#ast', () => ({
  dtsAlias: vi.fn(() => () => ({})),
}));

const { readPackage, toPosix } = await import('@mirta/package');
const mockReadPackage = vi.mocked(readPackage);

const { definePackageConfig } = await import('#configs/package');

describe('definePackageConfig', () => {

  const originalCwd = process.cwd();
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {

    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';

  });

  afterEach(() => {

    vi.spyOn(process, 'cwd').mockReturnValue(originalCwd);
    process.env.NODE_ENV = originalEnv;

  });

  describe('ESM bundle generation', () => {

    it('should generate single ESM config when no types defined', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': './dist/index.mjs',
        },
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(configs).toHaveLength(1);
      expect(configs[0].output).toMatchObject({
        dir: expect.stringContaining('dist') as unknown,
        format: 'es',
      });

    });

    it('should handle string input', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(configs).toHaveLength(1);
      expect(Array.isArray(configs[0].input)).toBe(true);

    });

    it('should handle array input', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': './dist/index.mjs',
          './utils': './dist/utils.mjs',
        },
      });

      const configs = definePackageConfig({
        input: ['src/index.ts', 'src/utils.ts'],
      });

      expect(configs).toHaveLength(1);
      expect(configs[0].input).toEqual(['src/index.ts', 'src/utils.ts']);

    });

    it('should handle object input', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': './dist/index.mjs',
          './lib': './dist/lib.mjs',
        },
      });

      const configs = definePackageConfig({
        input: {
          index: 'src/index.ts',
          lib: 'src/lib.ts',
        },
      });

      expect(configs).toHaveLength(1);
      expect(configs[0].input).toEqual(['src/index.ts', 'src/lib.ts']);

    });

    it('should configure TypeScript plugin correctly', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      const tsPlugin = ensureArray(configs[0].plugins)
        .find(p => p && 'name' in p && p.name === 'typescript');

      expect(tsPlugin).toBeDefined();

    });

    it('should set importAttributesKey to "with"', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(configs[0].output).toMatchObject({
        importAttributesKey: 'with',
      });

    });

    it('should configure external filter', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
        external: ['some-lib'],
      });

      expect(configs[0].external).toBeDefined();
      expect(typeof configs[0].external).toBe('function');

    });

    it('should include custom plugins', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const customPlugin = { name: 'custom-plugin' };

      const configs = definePackageConfig({
        input: 'src/index.ts',
        plugins: [customPlugin],
      });

      expect(configs[0].plugins).toContainEqual(customPlugin);

    });

  });

  describe('DTS bundle generation', () => {

    it('should generate DTS config when types are defined', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': {
            import: {
              types: './dist/index.d.mts',
              default: './dist/index.mjs',
            },
          },
        },
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(configs).toHaveLength(2);
      expect(configs[1].input).toEqual(['dist/dts/index.d.ts']);
      expect(configs[1].output).toMatchObject({
        dir: expect.stringContaining('dist') as unknown,
        format: 'es',
      });

    });

    it('should configure DTS plugins', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': {
            import: {
              types: './dist/index.d.mts',
              default: './dist/index.mjs',
            },
          },
        },
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      const dtsConfig = configs[1];

      const pluginNames = ensureArray(dtsConfig.plugins)
        .map(p => p && 'name' in p ? p.name : null);

      expect(pluginNames).toContain('node-resolve');
      expect(pluginNames).toContain('commonjs');
      expect(pluginNames).toContain('dts');
      expect(pluginNames).toContain('del');

    });

    it('should handle multiple entries with types', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': {
            import: {
              types: './dist/index.d.mts',
              default: './dist/index.mjs',
            },
          },
          './utils': {
            import: {
              types: './dist/utils.d.mts',
              default: './dist/utils.mjs',
            },
          },
        },
      });

      const configs = definePackageConfig({
        input: ['src/index.ts', 'src/utils.ts'],
      });

      expect(configs).toHaveLength(2);
      expect(configs[1].input).toEqual([
        'dist/dts/index.d.ts',
        'dist/dts/utils.d.ts',
      ]);

    });

    it('should not generate DTS config when types are absent', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': './dist/index.mjs',
          './utils': './dist/utils.mjs',
        },
      });

      const configs = definePackageConfig({
        input: ['src/index.ts', 'src/utils.ts'],
      });

      expect(configs).toHaveLength(1);

    });

    it('should handle mixed: some with types, some without', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': {
            import: {
              types: './dist/index.d.mts',
              default: './dist/index.mjs',
            },
          },
          './utils': './dist/utils.mjs',
        },
      });

      const configs = definePackageConfig({
        input: ['src/index.ts', 'src/utils.ts'],
      });

      expect(configs).toHaveLength(2);
      expect(configs[1].input).toEqual(['dist/dts/index.d.ts']);

    });

  });

  describe('bootstrap mode (monorepo context)', () => {

    it('should add package prefix when cwd differs from process.cwd()', () => {

      const rootDir = '/home/user/monorepo';
      const packageDir = '/home/user/monorepo/packages/core';

      vi.spyOn(process, 'cwd').mockReturnValue(rootDir);

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        cwd: packageDir,
        input: 'src/index.ts',
      });

      const expectedPrefix = toPosix(nodePath.relative(rootDir, packageDir));
      expect(configs[0].input).toEqual([`${expectedPrefix}/src/index.ts`]);

    });

    it('should add prefix to DTS inputs in bootstrap mode', () => {

      const rootDir = '/repo';
      const packageDir = '/repo/packages/app';

      vi.spyOn(process, 'cwd').mockReturnValue(rootDir);

      mockReadPackage.mockReturnValue({
        exports: {
          '.': {
            import: {
              types: './dist/index.d.mts',
              default: './dist/index.mjs',
            },
          },
        },
      });

      const configs = definePackageConfig({
        cwd: packageDir,
        input: 'src/index.ts',
      });

      expect(configs).toHaveLength(2);
      expect(configs[1].input).toEqual(['packages/app/dist/dts/index.d.ts']);

    });

    it('should not add prefix when cwd equals process.cwd()', () => {

      const workingDir = '/home/user/package';

      vi.spyOn(process, 'cwd').mockReturnValue(workingDir);

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        cwd: workingDir,
        input: 'src/index.ts',
      });

      expect(configs[0].input).toEqual(['src/index.ts']);

    });

    it('should handle nested package structure', () => {

      const rootDir = '/monorepo';
      const packageDir = '/monorepo/packages/nested/deep/pkg';

      vi.spyOn(process, 'cwd').mockReturnValue(rootDir);

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        cwd: packageDir,
        input: 'src/index.ts',
      });

      expect(configs[0].input).toEqual(['packages/nested/deep/pkg/src/index.ts']);

    });

  });

  describe('skipExports mode', () => {

    it('should skip exports validation when skipExports is true', () => {

      mockReadPackage.mockReturnValue({
        exports: undefined,
      });

      const configs = definePackageConfig({
        input: 'src/cli.ts',
        skipExports: true,
      });

      expect(configs).toHaveLength(1);

    });

    it('should not generate DTS config in skipExports mode', () => {

      mockReadPackage.mockReturnValue({});

      const configs = definePackageConfig({
        input: ['src/bin.ts', 'src/server.ts'],
        skipExports: true,
      });

      expect(configs).toHaveLength(1);

    });

    it('should work with multiple inputs in skipExports mode', () => {

      mockReadPackage.mockReturnValue({});

      const configs = definePackageConfig({
        input: ['src/cli.ts', 'src/daemon.ts', 'src/worker.ts'],
        skipExports: true,
      });

      expect(configs[0].input).toEqual([
        'src/cli.ts',
        'src/daemon.ts',
        'src/worker.ts',
      ]);

    });

  });

  describe('default behavior', () => {

    it('should use default input "src/index.ts" when not specified', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig();

      expect(configs[0].input).toEqual(['src/index.ts']);

    });

    it('should use process.cwd() as default cwd', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(ensureArray(configs[0].output)[0]?.dir).toContain('dist');

    });

    it('should have empty external array by default', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(configs[0].external).toBeDefined();

    });

    it('should not skip exports validation by default', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': './dist/index.mjs',
          './orphan': './dist/orphan.mjs',
        },
      });

      expect(() =>
        definePackageConfig({
          input: 'src/index.ts',
        })
      ).toThrow();

    });

  });

  describe('entryFileNames resolution', () => {

    it('should use binding outputFile when facadeModuleId matches', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          '.': './dist/index.mjs',
        },
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      const entryFileNamesFn = ensureArray(configs[0].output)[0]?.entryFileNames;

      expect(typeof entryFileNamesFn).toBe('function');

    });

    it('should fallback to chunk.name.mjs when no binding found', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      const entryFileNamesFn = ensureArray(configs[0].output)[0]?.entryFileNames;

      expect(typeof entryFileNamesFn).toBe('function');

    });

  });

  describe('environment configuration', () => {

    it('should set sourcemap based on SOURCE_MAP env', () => {

      process.env.SOURCE_MAP = '1';

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(ensureArray(configs[0].output)[0]?.sourcemap).toBe(true);

      delete process.env.SOURCE_MAP;

    });

    it('should disable sourcemap when SOURCE_MAP is not set', () => {

      delete process.env.SOURCE_MAP;

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(ensureArray(configs[0].output)[0]?.sourcemap).toBe(false);

    });

    it('should set externalLiveBindings to false', () => {

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        input: 'src/index.ts',
      });

      expect(ensureArray(configs[0].output)[0]?.externalLiveBindings).toBe(false);

    });

  });

  describe('edge cases', () => {

    it('should handle package.json at custom path', () => {

      const customCwd = '/custom/path/to/package';

      mockReadPackage.mockReturnValue({
        exports: './dist/index.mjs',
      });

      const configs = definePackageConfig({
        cwd: customCwd,
        input: 'src/index.ts',
      });

      expect(ensureArray(configs[0].output)[0]?.dir).toBe(nodePath.join(customCwd, 'dist'));

    });

    it('should handle deeply nested input paths', () => {

      mockReadPackage.mockReturnValue({
        exports: {
          './lib/utils/helper': './dist/lib/utils/helper.mjs',
        },
      });

      const configs = definePackageConfig({
        input: 'src/lib/utils/helper.ts',
      });

      expect(configs[0].input).toEqual(['src/lib/utils/helper.ts']);

    });

  });

});
