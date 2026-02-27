import { parsePackageJson } from '#src/parse-package-json';
import { PackageError } from '#src/errors/package-error';

describe('parsePackageJson', () => {

  describe('valid JSON inputs', () => {

    it('should parse a complete package.json object with exports', () => {

      const json = `{
        "name": "test-package",
        "version": "1.0.0",
        "exports": {
          ".": "./dist/index.js"
        }
      }`;

      const result = parsePackageJson(json);

      expect(result).toEqual({
        name: 'test-package',
        version: '1.0.0',
        exports: {
          '.': './dist/index.js',
        },
      });

    });

    it('should parse minimal package.json with only name', () => {

      const json = `{"name": "minimal"}`;

      const result = parsePackageJson(json);

      expect(result).toEqual({ name: 'minimal' });

    });

    it('should parse package.json with workspaces array', () => {

      const json = `{
        "name": "monorepo",
        "workspaces": ["packages/*", "apps/*"]
      }`;

      const result = parsePackageJson(json);

      expect(result).toEqual({
        name: 'monorepo',
        workspaces: ['packages/*', 'apps/*'],
      });

    });

    it('should handle empty object', () => {

      const json = '{}';

      const result = parsePackageJson(json);

      expect(result).toEqual({});

    });

  });

  describe('malformed JSON syntax', () => {

    it('should throw SyntaxError for invalid property syntax', () => {

      const invalidJson = '{ name: invalid }';

      expect(() => parsePackageJson(invalidJson)).toThrow(SyntaxError);

    });

    it('should throw SyntaxError for empty string', () => {

      expect(() => parsePackageJson('')).toThrow(SyntaxError);

    });

    it('should throw SyntaxError for trailing comma', () => {

      const json = `{
        "name": "trailing",
        "version": "1.0.0",
      }`;

      expect(() => parsePackageJson(json)).toThrow(SyntaxError);

    });

    it('should throw SyntaxError for unquoted keys', () => {

      const json = `{name: "test"}`;

      expect(() => parsePackageJson(json)).toThrow(SyntaxError);

    });

  });

  describe('invalid root type', () => {

    it('should throw PackageError when root is an array', () => {

      expect(() => parsePackageJson('[]'))
        .toThrow(PackageError.get('invalidJsonRoot'));

    });

    it('should throw PackageError when root is null', () => {

      expect(() => parsePackageJson('null'))
        .toThrow(PackageError.get('invalidJsonRoot'));

    });

    it('should throw PackageError when root is a string primitive', () => {

      expect(() => parsePackageJson('"string"'))
        .toThrow(PackageError.get('invalidJsonRoot'));

    });

    it('should throw PackageError when root is a number primitive', () => {

      expect(() => parsePackageJson('42'))
        .toThrow(PackageError.get('invalidJsonRoot'));

    });

    it('should throw PackageError when root is a boolean primitive', () => {

      expect(() => parsePackageJson('true'))
        .toThrow(PackageError.get('invalidJsonRoot'));

    });

  });

});
