import { createDtsMappings } from '#configs/package';

describe('createDtsMappings', () => {

  describe('successful mapping generation', () => {

    it('should create correct dts source to output mapping', () => {

      const inputBindings = {
        'src/index.ts': {
          outputFile: 'dist/index.mjs',
          dtsSourceFile: 'dist/dts/index.d.ts',
          dtsOutputFile: 'index.d.mts',
        },
        'src/utils.ts': {
          outputFile: 'dist/utils.mjs',
          dtsSourceFile: 'dist/dts/utils.d.ts',
          dtsOutputFile: 'utils.d.mts',
        },
      };

      const result = createDtsMappings(inputBindings);

      expect(result).toEqual({
        'dist/dts/index.d.ts': 'index.d.mts',
        'dist/dts/utils.d.ts': 'utils.d.mts',
      });

    });

    it('should handle nested directory structures', () => {

      const inputBindings = {
        'src/lib/core/index.ts': {
          outputFile: 'dist/lib/core/index.mjs',
          dtsSourceFile: 'dist/dts/lib/core/index.d.ts',
          dtsOutputFile: 'lib/core/index.d.mts',
        },
        'src/utils/helper.ts': {
          outputFile: 'dist/utils/helper.mjs',
          dtsSourceFile: 'dist/dts/utils/helper.d.ts',
          dtsOutputFile: 'utils/helper.d.mts',
        },
      };

      const result = createDtsMappings(inputBindings);

      expect(result).toEqual({
        'dist/dts/lib/core/index.d.ts': 'lib/core/index.d.mts',
        'dist/dts/utils/helper.d.ts': 'utils/helper.d.mts',
      });

    });

    it('should handle single entry', () => {

      const inputBindings = {
        'src/main.ts': {
          outputFile: 'dist/main.mjs',
          dtsSourceFile: 'dist/dts/main.d.ts',
          dtsOutputFile: 'main.d.mts',
        },
      };

      const result = createDtsMappings(inputBindings);

      expect(result).toEqual({
        'dist/dts/main.d.ts': 'main.d.mts',
      });

    });

  });

  describe('entries without dtsOutputFile', () => {

    it('should skip entries without dtsOutputFile', () => {

      const inputBindings = {
        'src/index.js': {
          outputFile: 'dist/index.mjs',
          dtsSourceFile: 'dist/dts/index.d.ts',
          dtsOutputFile: undefined,
        },
      };

      const result = createDtsMappings(inputBindings);

      expect(result).toEqual({});

    });

    it('should skip mixed entries, only mapping those with dtsOutputFile', () => {

      const inputBindings = {
        'src/typed.ts': {
          outputFile: 'dist/typed.mjs',
          dtsSourceFile: 'dist/dts/typed.d.ts',
          dtsOutputFile: 'typed.d.mts',
        },
        'src/untyped.js': {
          outputFile: 'dist/untyped.mjs',
          dtsSourceFile: 'dist/dts/untyped.d.ts',
          dtsOutputFile: undefined,
        },
        'src/another.ts': {
          outputFile: 'dist/another.mjs',
          dtsSourceFile: 'dist/dts/another.d.ts',
          dtsOutputFile: 'another.d.mts',
        },
      };

      const result = createDtsMappings(inputBindings);

      expect(result).toEqual({
        'dist/dts/typed.d.ts': 'typed.d.mts',
        'dist/dts/another.d.ts': 'another.d.mts',
      });
      expect(result).not.toHaveProperty('dist/dts/untyped.d.ts');

    });

  });

  describe('edge cases', () => {

    it('should handle empty input bindings', () => {

      const result = createDtsMappings({});

      expect(result).toEqual({});

    });

    it('should handle bindings with undefined entries', () => {

      const inputBindings = {
        'src/valid.ts': {
          outputFile: 'dist/valid.mjs',
          dtsSourceFile: 'dist/dts/valid.d.ts',
          dtsOutputFile: 'valid.d.mts',
        },
        'src/invalid.ts': undefined,
      };

      const result = createDtsMappings(inputBindings);

      expect(result).toEqual({
        'dist/dts/valid.d.ts': 'valid.d.mts',
      });

    });

  });

});
