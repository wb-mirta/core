import { resolvePackagePath } from '#src/resolve-package-path';
import { PackageError } from '#src/errors/package-error';

describe('resolvePackagePath', () => {

  describe('valid paths returning package.json path', () => {

    describe('paths already ending with package.json', () => {

      it('should return path as-is when it ends with package.json', () => {

        expect(resolvePackagePath('package.json')).toBe('package.json');

      });

      it('should return nested path as-is when it ends with package.json', () => {

        expect(resolvePackagePath('packages/core/package.json'))
          .toBe('packages/core/package.json');

      });

      it('should handle deeply nested paths', () => {

        expect(resolvePackagePath('apps/web/src/utils/package.json'))
          .toBe('apps/web/src/utils/package.json');

      });

    });

    describe('directory paths', () => {

      it('should append package.json to current directory (.)', () => {

        expect(resolvePackagePath('.')).toBe('package.json');

      });

      it('should append package.json to current directory with trailing slash', () => {

        expect(resolvePackagePath('./')).toBe('package.json');

      });

      it('should handle Windows-style current directory path', () => {

        expect(resolvePackagePath('.\\')).toBe('package.json');

      });

      it('should append package.json to subdirectory path', () => {

        expect(resolvePackagePath('packages/core')).toBe('packages/core/package.json');

      });

      it('should handle parent directory (..)', () => {

        expect(resolvePackagePath('..')).toBe('../package.json');

      });

      it('should handle multiple parent directories', () => {

        expect(resolvePackagePath('../../shared')).toBe('../../shared/package.json');

      });

      it('should handle directory path with trailing slash', () => {

        expect(resolvePackagePath('packages/core/')).toBe('packages/core/package.json');

      });

    });

  });

  describe('invalid paths throwing PackageError with code invalidPath', () => {

    describe('files with extensions (not package.json)', () => {

      it('should throw for TypeScript file', () => {

        expect(() => resolvePackagePath('src/index.ts'))
          .toThrow(PackageError.get('invalidPath', 'src/index.ts'));

      });

      it('should throw for JavaScript file', () => {

        expect(() => resolvePackagePath('lib/utils.js'))
          .toThrow(PackageError.get('invalidPath', 'lib/utils.js'));

      });

      it('should throw for JSON file (not package.json)', () => {

        expect(() => resolvePackagePath('config.json'))
          .toThrow(PackageError.get('invalidPath', 'config.json'));

      });

      it('should throw for markdown file', () => {

        expect(() => resolvePackagePath('README.md'))
          .toThrow(PackageError.get('invalidPath', 'README.md'));

      });

      it('should throw for text file', () => {

        expect(() => resolvePackagePath('LICENSE.txt'))
          .toThrow(PackageError.get('invalidPath', 'LICENSE.txt'));

      });

    });

    describe('files in parent directories', () => {

      it('should throw for file in parent directory', () => {

        expect(() => resolvePackagePath('../app/main.ts'))
          .toThrow(PackageError.get('invalidPath', '../app/main.ts'));

      });

      it('should throw for nested file in parent directory', () => {

        expect(() => resolvePackagePath('../../src/utils/helper.js'))
          .toThrow(PackageError.get('invalidPath', '../../src/utils/helper.js'));

      });

    });

    describe('edge cases', () => {

      it('should throw for file with multiple extensions', () => {

        expect(() => resolvePackagePath('archive.tar.gz'))
          .toThrow(PackageError.get('invalidPath', 'archive.tar.gz'));

      });

      it('should throw for hidden file', () => {

        expect(() => resolvePackagePath('.gitignore'))
          .toThrow(PackageError.get('invalidPath', '.gitignore'));

      });

    });

  });

});
