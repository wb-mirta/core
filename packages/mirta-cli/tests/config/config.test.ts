import { SourceError } from '#src/errors/source-error'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
}))

vi.mock('node:path', async () => {

  const actual = await vi.importActual<typeof import('node:path')>('node:path')
  return {
    ...actual,
    resolve: vi.fn((...paths: string[]) => paths.join('/')),
  }

})

const fsPromises = await import('node:fs/promises')
const mockReadFile = vi.mocked(fsPromises.readFile)
const mockAccess = vi.mocked(fsPromises.access)

const { defineConfig, parseConfigJson, readConfigAsync } = await import('#src/config/config')

describe('defineConfig', () => {

  it('should return the same config object', () => {

    const config = {
      connections: {
        default: 'ssh://root@192.168.42.1',
      },
    }

    const result = defineConfig(config)

    expect(result).toBe(config)

  })

  it('should work with empty config', () => {

    const config = {}

    const result = defineConfig(config)

    expect(result).toEqual({})

  })

})

describe('parseConfigJson', () => {

  it('should parse valid JSON5', () => {

    const json = `{
      connections: {
        default: "ssh://root@192.168.42.1",
      },
    }`

    const result = parseConfigJson(json)

    expect(result).toEqual({
      connections: {
        default: 'ssh://root@192.168.42.1',
      },
    })

  })

  it('should parse JSON with comments', () => {

    const json = `{
      // Default connection
      connections: {
        default: "ssh://root@192.168.42.1", // Controller
      },
    }`

    const result = parseConfigJson(json) as Record<string, unknown>

    expect(result.connections).toBeDefined()

  })

  it('should parse JSON with trailing commas', () => {

    const json = `{
      connections: {
        default: "ssh://root@192.168.42.1",
      },
    }`

    const result = parseConfigJson(json)

    expect(result).toHaveProperty('connections')

  })

  it('should throw when JSON is invalid', () => {

    const json = '{ invalid json'

    expect(() => parseConfigJson(json)).toThrow()

  })

  it('should throw when root is not an object', () => {

    const json = '["array", "root"]'

    expect(() => parseConfigJson(json)).toThrow(SourceError.get('parse.invalidJsonRoot'))

  })

  it('should throw when root is null', () => {

    const json = 'null'

    expect(() => parseConfigJson(json)).toThrow(SourceError.get('parse.invalidJsonRoot'))

  })

  it('should throw when root is a primitive', () => {

    const json = '"string"'

    expect(() => parseConfigJson(json)).toThrow(SourceError.get('parse.invalidJsonRoot'))

  })

})

describe('readConfigAsync', () => {

  beforeEach(() => {

    mockReadFile.mockClear()
    mockAccess.mockClear()

  })

  it('should read and parse config file', async () => {

    const configContent = `{
      connections: {
        default: "ssh://root@192.168.42.1",
      },
    }`

    mockAccess.mockResolvedValue(undefined)
    mockReadFile.mockResolvedValue(configContent)

    const result = await readConfigAsync('/project', 'mirta.config.json')

    expect(result).toEqual({
      connections: {
        default: 'ssh://root@192.168.42.1',
      },
    })

  })

  it('should return undefined when file does not exist', async () => {

    mockAccess.mockRejectedValue({ code: 'ENOENT' })

    const result = await readConfigAsync('/project', 'mirta.config.json')

    expect(result).toBeUndefined()

  })

  it('should throw file.accessDenied on permission error', async () => {

    mockAccess.mockResolvedValue(undefined)
    mockReadFile.mockRejectedValue({ code: 'EACCES' })

    await expect(readConfigAsync('/project', 'mirta.config.json'))
      .rejects
      .toThrow(SourceError.get('file.accessDenied', '/project/mirta.config.json'))

  })

  it('should throw file.failedToRead on other read errors', async () => {

    mockAccess.mockResolvedValue(undefined)
    mockReadFile.mockRejectedValue(new Error('Disk error'))

    await expect(readConfigAsync('/project', 'mirta.config.json'))
      .rejects
      .toThrow(SourceError.get(
        'file.failedToRead',
        '/project/mirta.config.json',
        'Disk error'
      ))

  })

  it('should throw parse.invalidJson on malformed JSON', async () => {

    mockAccess.mockResolvedValue(undefined)
    mockReadFile.mockResolvedValue('{ invalid json')

    await expect(readConfigAsync('/project', 'mirta.config.json'))
      .rejects
      .toThrow(/Invalid JSON in file/)

  })

  it('should resolve config path relative to rootDir', async () => {

    mockAccess.mockResolvedValue(undefined)
    mockReadFile.mockResolvedValue('{}')

    await readConfigAsync('/project', 'config/mirta.json')

    expect(mockReadFile).toHaveBeenCalledWith('/project/config/mirta.json', 'utf-8')

  })

})
