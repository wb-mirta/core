import { type OutputOptions, type PreRenderedChunk, type Plugin } from 'rollup'

const fs = await import('fs')
const readFileSync = vi.mocked(fs.readFileSync)
const nodePath = vi.mocked((await import('node:path')).default, true)

import { NpmBuildError } from '#utils/errors'

// Mock fs module
vi.mock('fs', () => ({

  readFileSync: vi.fn(),

}))

// Mock node:path to ensure consistent behavior
vi.mock('node:path', async () => {

  const actual = await vi.importActual<typeof nodePath>('node:path')

  return {

    ...actual,

    default: {
      ...actual,
      resolve: vi.fn((...args: string[]) => actual.resolve(...args)),
      relative: vi.fn((from: string, to: string) => actual.relative(from, to)),
      sep: actual.sep,
      posix: actual.posix,
    },
  }

})

// Import after mocking
const { definePackageConfig } = await import('#configs/package')

describe('package.ts - normalizeInput', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should handle string input', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(config).toHaveLength(2) // mjs build + dts build
    expect(config[0].input).toBe('src/index.ts')

  })

  it('should handle array input', () => {

    const mockPackage = {
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
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.ts', 'src/utils.ts'],
    })

    expect(config).toHaveLength(2)
    expect(config[0].input).toEqual(['src/index.ts', 'src/utils.ts'])

  })

  it('should handle object input', () => {

    const mockPackage = {
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
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: {
        index: 'src/index.ts',
        utils: 'src/utils.ts',
      },
    })

    expect(config).toHaveLength(2)
    expect(config[0].input).toEqual({
      index: 'src/index.ts',
      utils: 'src/utils.ts',
    })

  })

  it('should throw BuildError for empty input', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        cwd: '/test/project',
        input: [],
      })

    }).toThrow(NpmBuildError.get('inputEmpty'))

  })

  it('should throw BuildError for empty object input', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: {},
      })

    }).toThrow(NpmBuildError.get('inputEmpty'))

  })

})

describe('package.ts - getInputBindings', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should map single entry point correctly', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(config).toBeDefined()
    expect((config[0]?.output as OutputOptions).dir).toBe('dist/')

  })

  it('should handle src/setup.ts', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './setup': {
          import: {
            default: './dist/setup.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    // Should work with explicit file
    const config = definePackageConfig({
      input: ['src/index.ts', 'src/setup.ts'],
    })

    expect(config).toBeDefined()

  })

  it('should handle nested index file structure (src/setup/index.ts)', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './setup': {
          import: {
            types: './dist/setup/index.d.mts',
            default: './dist/setup/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.ts', 'src/setup/index.ts'],
    })

    expect(config).toBeDefined()

  })

  it('should not use export path ./dist/utils.mjs as output point for src/utils/index.ts', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './utils': {
          import: {
            default: './dist/utils.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    // Should ignore export pattern ./dist/utils.mjs
    expect(() => {

      definePackageConfig({
        input: ['src/index.ts', 'src/utils/index.ts'],
      })

    }).toThrow(NpmBuildError.get('inputHasNoExport', 'src/utils/index.ts', './dist/utils/index.mjs'))

  })

  it('should throw error for input not matching any export pattern', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: ['src/index.ts', 'src/nonexistent.ts'],
      })

    }).toThrow(NpmBuildError.get('inputHasNoExport', 'src/nonexistent.ts', './dist/nonexistent.mjs'))

  })

  it('should handle .js input files correctly', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './utils': {
          import: {
            default: './dist/utils.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.js', 'src/utils.js'],
    })

    expect(config).toBeDefined()
    expect(config[0].input).toEqual(['src/index.js', 'src/utils.js'])

  })

  it('should handle nested export paths', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './components/button': {
          import: {
            default: './dist/components/button.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.ts', 'src/components/button.ts'],
    })

    expect(config).toBeDefined()

  })

  it('should throw BuildError when input file is not associated with export', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: ['src/index.ts', 'src/unknown.ts'],
      })

    }).toThrow(NpmBuildError.get('inputHasNoExport', 'src/unknown.ts', './dist/unknown.mjs'))

  })

  it('should throw BuildError when export has no corresponding input', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './utils': {
          import: {
            default: './dist/utils.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('exportHasNoInput', './dist/utils.mjs'))

  })

  it('should handle exports without import.default', () => {

    const mockPackage = {
      exports: {
        '.': {
          require: './dist/index.cjs',
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('inputHasNoExport', 'src/index.ts', './dist/index.mjs'))

  })

  it('should handle exports not starting with dot', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        'package.json': './package.json',
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('exportMustStartWithDot', 'package.json'))

  })

  it('should handle .js input files', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.js',
    })

    expect(config).toBeDefined()

  })

  it('should strip ./dist/ prefix from output file paths', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    // The output should be relative to dist/ directory
    expect((config[0].output as OutputOptions).dir).toBe('dist/')

  })

})

describe('package.ts - getDtsMappings', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should create DTS mappings when types are defined', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    // Should have 2 configs: mjs build + dts build
    expect(config).toHaveLength(2)
    expect(config[1].plugins).toBeDefined()

  })

  it('should skip DTS build when no types are defined', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    // Should only have 1 config: mjs build (no dts)
    expect(config).toHaveLength(1)

  })

  it('should handle multiple DTS entry points', () => {

    const mockPackage = {
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
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.ts', 'src/utils.ts'],
    })

    expect(config).toHaveLength(2)
    // DTS config should have multiple inputs
    expect(Array.isArray(config[1].input)).toBe(true)

  })

  it('should throw BuildError when type definition has no corresponding input', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
        './missing': {
          import: {
            types: './dist/missing.d.mts',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('exportTypesOnly', './dist/missing.d.mts'))

  })

  it('should strip ./dist/ prefix from DTS output paths', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/types/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[1].output as OutputOptions).dir).toBe('dist/')

  })

})

describe('package.ts - definePackageConfig', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should use default cwd when not provided', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(config).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(vi.mocked(nodePath.resolve)).toHaveBeenCalled()

  })

  it('should use default input when not provided', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({ })

    expect(config).toBeDefined()
    expect(config[0].input).toBe('src/index.ts')

  })

  it('should correctly configure external using createExternalFilter', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
      external: ['lodash', /^react/],
    })

    // external теперь функция, а не массив
    expect(typeof config[0].external).toBe('function')

    // Проверяем, что функция работает правильно
    const externalFn = config[0].external as (id: string) => boolean

    expect(externalFn('lodash')).toBe(true)
    expect(externalFn('react-dom')).toBe(true)
    expect(externalFn('vue')).toBe(false)

  })

  it('should include custom plugins in configuration', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const customPlugin = { name: 'custom-plugin' }

    const config = definePackageConfig({
      input: 'src/index.ts',
      plugins: [
        customPlugin,
      ],
    })

    expect(config[0].plugins).toContainEqual(customPlugin)

  })

  it('should handle package without exports', () => {

    const mockPackage = {}

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow()

  })

  it('should configure ES module output format', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[0].output as OutputOptions).format).toBe('es')
    expect((config[0].output as OutputOptions).importAttributesKey).toBe('with')

  })

  it('should set output directory correctly', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[0].output as OutputOptions).dir).toBe('dist/')

  })

  it('should configure chunk file names correctly', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[0].output as OutputOptions).chunkFileNames).toBe('[name].mjs')

  })

  it('should configure DTS deletion after build', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    // DTS config should have del plugin
    const dtsConfig = config[1]

    const delPlugin = (dtsConfig.plugins as Plugin[]).find(p => p.name === 'del')

    expect(delPlugin).toBeDefined()

  })

})

describe('package.ts - entryFileNames function', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should handle unmapped input', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/custom-name.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('inputHasNoExport', 'src/index.ts', './dist/index.mjs'))

  })

  it('should fall back to default name when no mapping exists', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    const entryFileNames = (config[0].output as OutputOptions).entryFileNames as (chunk: Partial<PreRenderedChunk>) => string
    expect(entryFileNames).toBeDefined()

    // Test with chunk that has no facadeModuleId
    const result = entryFileNames({ name: 'test-chunk' })
    expect(result).toBe('test-chunk.mjs')

  })

})

describe('package.ts - environment variables', () => {

  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {

    vi.clearAllMocks()
    originalEnv = { ...process.env }

  })

  afterEach(() => {

    process.env = originalEnv

  })

  it('should enable sourcemaps when SOURCE_MAP is set', () => {

    process.env.SOURCE_MAP = 'true'

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[0].output as OutputOptions).sourcemap).toBe(true)

  })

  it('should not enable sourcemaps by default', () => {

    delete process.env.SOURCE_MAP

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[0].output as OutputOptions).sourcemap).toBe(false)

  })

  it('should disable external live bindings', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[0].output as OutputOptions).externalLiveBindings).toBe(false)

  })

})

describe('package.ts - complex scenarios', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should handle mixed .ts and .js extensions', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './utils': {
          import: {
            default: './dist/utils.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.ts', 'src/utils.js'],
    })

    expect(config).toBeDefined()

  })

  it('should handle exports with nested paths', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
        './utils/helpers': {
          import: {
            types: './dist/utils/helpers.d.mts',
            default: './dist/utils/helpers.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.ts', 'src/utils/helpers.ts'],
    })

    expect(config).toBeDefined()

  })

  it('should handle package with only index export', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(config).toHaveLength(2)
    expect(config[0].input).toBe('src/index.ts')

  })

  it('should correctly handle external dependencies', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(typeof config[0].external).toBe('function')

  })

  it('should include package.json path in external', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(config[0].external).toBeDefined()

  })

})

describe('package.ts - edge cases', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should handle empty exports object', () => {

    const mockPackage = {
      exports: {},
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('inputHasNoExport', 'src/index.ts', './dist/index.mjs'))

  })

  it('should handle exports with only types (no default)', () => {

    const mockPackage = {
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
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('exportTypesOnly', './dist/utils.d.mts'))

  })

  it('should handle malformed package.json', () => {

    vi.mocked(readFileSync).mockReturnValue('invalid json')

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow()

  })

  it('should handle exports with different path prefixes', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            default: 'dist/index.mjs', // without ./
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    expect(() => {

      definePackageConfig({
        input: 'src/index.ts',
      })

    }).toThrow(NpmBuildError.get('inputHasNoExport', 'src/index.ts', './dist/index.mjs'))

  })

  it('should handle root key only (.) export', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(config).toHaveLength(2)

  })

})
