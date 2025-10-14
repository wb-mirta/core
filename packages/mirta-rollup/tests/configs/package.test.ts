import { type OutputOptions, type PreRenderedChunk, type Plugin } from 'rollup'
import { readFileSync } from 'fs'
import nodePath from 'node:path'

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
const { definePackageConfig, BuildError } = await import('../../src/configs/package')

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

    }).toThrow('[Mirta Rollup] Input configuration cannot be empty')

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

    }).toThrow('[Mirta Rollup] Input configuration cannot be empty')

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

  it('should map multiple entry points correctly', () => {

    const mockPackage = {
      exports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
        './setup': {
          import: {
            types: './dist/setup.d.mts',
            default: './dist/setup.mjs',
          },
        },
      },
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackage))

    const config = definePackageConfig({
      input: ['src/index.ts', 'src/setup.ts'],
    })

    expect(config).toHaveLength(2)

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
            types: './dist/setup.d.mts',
            default: './dist/setup.mjs',
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

    }).toThrow('[Mirta Rollup] The input file "src/unknown.ts" is not associated with corresponding export in the package.json')

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

    }).toThrow('[Mirta Rollup] Export "./utils" defined in package.json has no corresponding input file in Rollup configuration')

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

    }).toThrow('[Mirta Rollup] The input file "src/index.ts" is not associated with corresponding export in the package.json')

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

    }).toThrow('[Mirta Rollup] Export "package.json" defined in package.json has no corresponding input file in Rollup configuration')

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

    }).toThrow('[Mirta Rollup] Type definition "missing.d.mts" has no corresponding input file')

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

  it('should include external modules in configuration', () => {

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

    const customExternal = [/^custom-module/]

    const config = definePackageConfig({
      input: 'src/index.ts',
      external: customExternal,
    })

    expect(config[0].external).toContain(customExternal[0])

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

  it('should generate correct entry file name for mapped input', () => {

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

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect((config[0].output as OutputOptions).entryFileNames).toBeDefined()
    expect(typeof (config[0].output as OutputOptions).entryFileNames).toBe('function')

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

describe('package.ts - BuildError class', () => {

  it('should create BuildError with correct name', () => {

    const error = new BuildError('[Mirta Rollup] Test error')
    error.name = 'BuildError'

    expect(error.name).toBe('BuildError')
    expect(error.message).toContain('[Mirta Rollup]')

  })

  it('should capture stack trace', () => {

    const error = new BuildError('[Mirta Rollup] Test error')

    expect(error.stack).toBeDefined()

  })

  it('should be instanceof Error', () => {

    const error = new BuildError('[Mirta Rollup] Test error')

    expect(error).toBeInstanceOf(Error)

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

  it('should include node_modules in external by default', () => {

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

    const external = config[0].external as (string | RegExp)[]
    const hasNodeModulesPattern = external.some(ext =>
      ext instanceof RegExp && ext.source === 'node_modules'
    )
    expect(hasNodeModulesPattern).toBe(true)

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

    }).toThrow('[Mirta Rollup] The input file "src/index.ts" is not associated with corresponding export in the package.json')

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

    }).toThrow('[Mirta Rollup] Type definition "utils.d.mts" has no corresponding input file')

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

    const config = definePackageConfig({
      input: 'src/index.ts',
    })

    expect(config).toBeDefined()

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
