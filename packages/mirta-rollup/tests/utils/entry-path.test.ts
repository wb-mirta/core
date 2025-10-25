const { getEntryPath } = await import('#utils/entry-path')

describe('getEntryPath', () => {

  describe('виртуальные пути', () => {

    it('должен вернуть виртуальный путь без изменений', () => {

      const virtualPath = '_virtual:some-module'
      const result = getEntryPath(virtualPath)

      expect(result).toBe(virtualPath)

    })

    it('должен обрабатывать виртуальные пути с параметрами', () => {

      const virtualPath = '_virtual:module?param=value'
      const result = getEntryPath(virtualPath)

      expect(result).toBe(virtualPath)

    })

  })

  describe('пути через node_modules', () => {

    it('должен преобразовать путь из node_modules в wb-rules-modules', () => {

      const sourcePath = 'some/path/node_modules/@scope/package/dist/index'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/package/index.js')

    })

    it('должен обрабатывать множественные уровни node_modules', () => {

      const sourcePath = 'path/node_modules/@scope/pkg/node_modules/nested/module'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/pkg/packages/nested/module.js')

    })

    it('должен обрабатывать пакеты без скоупа', () => {

      const sourcePath = 'node_modules/simple-package/dist/lib'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/simple-package/lib.js')

    })

    it('должен удалять /dist из пути пакета', () => {

      const sourcePath = 'node_modules/@scope/package/dist/index'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/package/index.js')

    })

    it('должен обрабатывать Windows-пути с обратными слешами', () => {

      const sourcePath = 'path\\node_modules\\@scope\\package\\dist\\index'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/package/index.js')

    })

  })

  describe('пути wb-rules-modules', () => {

    it('должен преобразовать путь с wb-rules-modules', () => {

      const sourcePath = 'src/wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/counter.js')

    })

    it('должен обрабатывать путь без src/', () => {

      const sourcePath = 'wb-rules-modules/utils/helper'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/utils/helper.js')

    })

    it('должен обрабатывать вложенные пути', () => {

      const sourcePath = 'src/wb-rules-modules/features/auth/login'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/features/auth/login.js')

    })

    it('должен обрабатывать Windows-пути', () => {

      const sourcePath = 'src\\wb-rules-modules\\counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/counter.js')

    })

  })

  describe('пути wb-rules', () => {

    it('должен преобразовать путь с wb-rules', () => {

      const sourcePath = 'src/wb-rules/main'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules/main.js')

    })

    it('должен обрабатывать путь без src/', () => {

      const sourcePath = 'wb-rules/controller'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules/controller.js')

    })

    it('должен обрабатывать вложенные структуры', () => {

      const sourcePath = 'src/wb-rules/devices/sensors/temperature'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules/devices/sensors/temperature.js')

    })

  })

  describe('приоритет обработки', () => {

    it('должен отдавать приоритет виртуальным путям', () => {

      const sourcePath = '_virtual:wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

    it('должен отдавать приоритет node_modules перед wb-rules-modules', () => {

      const sourcePath = 'node_modules/@scope/pkg/wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/packages/scope/pkg/wb-rules-modules/counter.js')

    })

    it('должен отдавать приоритет wb-rules-modules перед wb-rules', () => {

      // Если путь содержит wb-rules-modules, он обработается как wb-rules-modules
      const sourcePath = 'src/wb-rules-modules/counter'
      const result = getEntryPath(sourcePath)

      expect(result).toBe('wb-rules-modules/counter.js')

    })

  })

  describe('обработка неизвестных путей', () => {

    it('должен вернуть исходный путь если ничего не подошло', () => {

      const sourcePath = 'some/unknown/path/file.ts'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

    it('должен вернуть путь с точкой в начале', () => {

      const sourcePath = './relative/path/file.ts'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

    it('должен обрабатывать абсолютные пути', () => {

      const sourcePath = '/absolute/path/to/file.ts'
      const result = getEntryPath(sourcePath)

      expect(result).toBe(sourcePath)

    })

  })

})
