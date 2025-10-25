import nodePath from 'node:path'

const { getEntryPath } = await import('#utils/entry-path')

describe('getEntryPath', () => {

  describe('virtual paths', () => {

    it('should return virtual path unchanged', () => {

      const virtualPath = '_virtual:some-module'
      const result = getEntryPath(virtualPath)

      expect(result).toBe(virtualPath)

    })

    it('should handle virtual paths with parameters', () => {

      const virtualPath = '_virtual:module?param=value'
      const result = getEntryPath(virtualPath)

      expect(result).toBe(virtualPath)

    })

  })

  describe('node_modules paths', () => {

    it('should convert node_modules path to wb-rules-modules format', () => {

      const sourcePath = 'some/path/node_modules/@scope/package/dist/index'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/package/index.js')

    })

    it('should handle multiple node_modules levels', () => {

      const sourcePath = 'path/node_modules/@scope/pkg/node_modules/nested/module'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/pkg/packages/nested/module.js')

    })

    it('should handle packages without scope', () => {

      const sourcePath = 'node_modules/simple-package/dist/lib'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/simple-package/lib.js')

    })

    it('should remove /dist from package path', () => {

      const sourcePath = 'node_modules/@scope/package/dist/index'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/package/index.js')

    })

    it('should handle Windows paths with backslashes', () => {

      const sourcePath = 'path/node_modules/@scope/package/dist/index'
        .split(nodePath.posix.sep)
        .join(nodePath.sep)

      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/package/index.js')

    })

  })

  describe('wb-rules-modules paths', () => {

    it('should convert path with wb-rules-modules', () => {

      const sourcePath = 'src/wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/counter.js')

    })

    it('should handle path without src/', () => {

      const sourcePath = 'wb-rules-modules/utils/helper'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/utils/helper.js')

    })

    it('should handle nested paths', () => {

      const sourcePath = 'src/wb-rules-modules/features/auth/login'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/features/auth/login.js')

    })

    it('should handle Windows paths', () => {

      const sourcePath = 'src\\wb-rules-modules\\counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/counter.js')

    })

  })

  describe('wb-rules paths', () => {

    it('should convert path with wb-rules', () => {

      const sourcePath = 'src/wb-rules/main'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules/main.js')

    })

    it('should handle path without src/', () => {

      const sourcePath = 'wb-rules/controller'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules/controller.js')

    })

    it('should handle nested structures', () => {

      const sourcePath = 'src/wb-rules/devices/sensors/temperature'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules/devices/sensors/temperature.js')

    })

  })

  describe('priority handling', () => {

    it('should prioritize virtual paths', () => {

      const sourcePath = '_virtual:wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

    it('should prioritize node_modules over wb-rules-modules', () => {

      const sourcePath = 'node_modules/@scope/pkg/wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/pkg/wb-rules-modules/counter.js')

    })

    it('should prioritize wb-rules-modules over wb-rules', () => {

      // Если путь содержит wb-rules-modules, он обработается как wb-rules-modules
      const sourcePath = 'src/wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/counter.js')

    })

  })

  describe('unknown paths handling', () => {

    it('should return original path if nothing matches', () => {

      const sourcePath = 'some/unknown/path/file.ts'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

    it('should return path with leading dot', () => {

      const sourcePath = './relative/path/file.ts'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

    it('should handle absolute paths', () => {

      const sourcePath = '/absolute/path/to/file.ts'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

  })

})
