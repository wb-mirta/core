/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { Plugin } from 'rollup'

// Mock all external dependencies before imports
vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
  },
}))

vi.mock('@mirta/workspace', () => ({
  resolveMonorepoContextAsync: vi.fn(),
}))

vi.mock('@rollup/plugin-multi-entry', () => ({
  default: vi.fn(() => ({ name: 'multi-entry' })),
}))

vi.mock('@rollup/plugin-node-resolve', () => ({
  default: vi.fn(() => ({ name: 'node-resolve' })),
}))

vi.mock('@rollup/plugin-typescript', () => ({
  default: vi.fn(() => ({ name: 'typescript' })),
}))

vi.mock('@rollup/plugin-replace', () => ({
  default: vi.fn(() => ({ name: 'replace' })),
}))

vi.mock('@rollup/plugin-babel', () => ({
  getBabelOutputPlugin: vi.fn(() => ({ name: 'babel' })),
}))

vi.mock('@mirta/env-loader', () => ({
  loadEnvReplacements: vi.fn(() => ({})),
}))

vi.mock('#plugins/del', () => ({
  default: vi.fn(() => ({ name: 'del' })),
}))

vi.mock('#plugins/wb-rules-imports', () => ({
  default: vi.fn(() => ({ name: 'wb-rules-imports' })),
}))

// Import after mocks
import fs from 'node:fs/promises'
import nodePath from 'node:path'
import multi from '@rollup/plugin-multi-entry'
import resolve from '@rollup/plugin-node-resolve'
import ts from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import { loadEnvReplacements } from '@mirta/env-loader'
import { resolveMonorepoContextAsync } from '@mirta/workspace'
import del from '#plugins/del'
import wbRulesImports from '#plugins/wb-rules-imports'
import { defineRuntimeConfig } from '#configs/runtime'

describe('defineRuntimeConfig', () => {

  const mockCwd = '/test/project'
  const mockRootDir = '/test/monorepo'

  beforeEach(() => {

    vi.clearAllMocks()

    // Default monorepo context mock
    vi.mocked(resolveMonorepoContextAsync).mockResolvedValue({
      rootDir: mockRootDir,
      packages: [],
      manager: 'pnpm',
    })

    // Default env replacements mock
    vi.mocked(loadEnvReplacements).mockReturnValue({})

  })

  describe('tsconfig resolution', () => {

    it('should use custom tsconfig when provided in options', async () => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

      await defineRuntimeConfig({
        cwd: mockCwd,
        tsconfig: 'custom.tsconfig.json',
      })

      expect(ts).toHaveBeenCalledWith(expect.objectContaining({
        tsconfig: nodePath.resolve(mockCwd, 'custom.tsconfig.json'),
        outDir: 'dist/es5',
      }))

    })

    it('should resolve to tsconfig.build.json when it exists', async () => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

      await defineRuntimeConfig({
        cwd: mockCwd,
      })

      const expectedPath = nodePath.resolve(mockCwd, 'tsconfig.build.json')
      expect(fs.access).toHaveBeenCalledWith(expectedPath)
      expect(ts).toHaveBeenCalledWith(expect.objectContaining({
        tsconfig: expectedPath,
        outDir: 'dist/es5',
      }))

    })

    it('should fallback to tsconfig.json when tsconfig.build.json is missing', async () => {

      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce(undefined)

      await defineRuntimeConfig({
        cwd: mockCwd,
      })

      expect(fs.access).toHaveBeenCalledTimes(2)
      expect(fs.access).toHaveBeenNthCalledWith(
        1,
        nodePath.resolve(mockCwd, 'tsconfig.build.json')
      )
      expect(fs.access).toHaveBeenNthCalledWith(
        2,
        nodePath.resolve(mockCwd, 'tsconfig.json')
      )
      expect(ts).toHaveBeenCalledWith(expect.objectContaining({
        tsconfig: nodePath.resolve(mockCwd, 'tsconfig.json'),
        outDir: 'dist/es5',
      }))

    })

    it('should return undefined when cwd equals process.cwd() and no tsconfig found', async () => {

      const currentCwd = process.cwd()
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'))

      await defineRuntimeConfig({
        cwd: currentCwd,
      })

      expect(ts).toHaveBeenCalledWith(expect.objectContaining({
        tsconfig: undefined,
        outDir: 'dist/es5',
      }))

    })

    it('should return false when custom cwd differs from process.cwd() and both configs are missing', async () => {

      vi.mocked(fs.access)
        .mockRejectedValue(new Error('ENOENT'))

      await defineRuntimeConfig({
        cwd: mockCwd,
      })

      expect(fs.access)
        .toHaveBeenCalledTimes(2)

      expect(ts).toHaveBeenCalledWith(expect.objectContaining({
        tsconfig: false,
        outDir: 'dist/es5',
      }))

    })

  })

  describe('monorepo context', () => {

    it('should resolve monorepo context with provided cwd', async () => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

      await defineRuntimeConfig({
        cwd: mockCwd,
      })

      expect(resolveMonorepoContextAsync).toHaveBeenCalledWith(mockCwd)

    })

    it('should use process.cwd() when cwd is not provided', async () => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

      await defineRuntimeConfig()

      expect(resolveMonorepoContextAsync).toHaveBeenCalledWith(process.cwd())

    })

  })

  describe('plugins configuration', () => {

    beforeEach(() => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

    })

    it('should include all default plugins', async () => {

      const config = await defineRuntimeConfig({ cwd: mockCwd })

      expect(config.plugins).toBeDefined()
      expect(del).toHaveBeenCalledTimes(2) // Initial cleanup and closeBundle cleanup
      expect(multi).toHaveBeenCalled()
      expect(resolve).toHaveBeenCalled()
      expect(ts).toHaveBeenCalled()
      expect(wbRulesImports).toHaveBeenCalled()
      expect(replace).toHaveBeenCalled()
      expect(getBabelOutputPlugin).toHaveBeenCalled()

    })

    it('should append custom plugins after default plugins', async () => {

      const customPlugin = { name: 'custom' }

      const config = await defineRuntimeConfig({
        cwd: mockCwd,
        plugins: [customPlugin],
      })

      expect(config.plugins).toBeDefined()
      expect(Array.isArray(config.plugins)).toBe(true)
      expect(config.plugins).toContainEqual(customPlugin)
      expect((config.plugins as Plugin[]).at(-1)).toBe(customPlugin)

    })

    it('should configure del plugin with correct targets', async () => {

      await defineRuntimeConfig({ cwd: mockCwd })

      expect(del).toHaveBeenNthCalledWith(1, {
        targets: 'dist/es5',
      })
      expect(del).toHaveBeenNthCalledWith(2, {
        targets: 'dist/es5/_virtual',
        hook: 'closeBundle',
      })

    })

    it('should configure replace plugin with env replacements', async () => {

      const mockEnvReplacements = {
        'process.env.API_URL': '"https://api.example.com"',
      }
      vi.mocked(loadEnvReplacements).mockReturnValue(mockEnvReplacements)

      await defineRuntimeConfig({ cwd: mockCwd })

      expect(replace).toHaveBeenCalledWith({
        preventAssignment: true,
        values: expect.objectContaining(mockEnvReplacements),
      })

    })

  })

  describe('external dependencies', () => {

    beforeEach(() => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

    })

    it('should pass external option to config', async () => {

      const external = ['react', 'react-dom']
      const config = await defineRuntimeConfig({
        cwd: mockCwd,
        external,
      })

      expect(config.external).toBe(external)

    })

    it('should have undefined external when not provided', async () => {

      const config = await defineRuntimeConfig({ cwd: mockCwd })

      expect(config.external).toBeUndefined()

    })

  })

  describe('output configuration', () => {

    beforeEach(() => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

    })

    it('should configure output with correct format and directory', async () => {

      const config = await defineRuntimeConfig({ cwd: mockCwd })

      expect(config.output).toMatchObject({
        format: 'cjs',
        strict: false,
        dir: 'dist/es5',
        preserveModules: true,
      })

    })

    it('should have entryFileNames function', async () => {

      const config = await defineRuntimeConfig({ cwd: mockCwd })

      const output = Array.isArray(config.output) ? config.output[0] : config.output

      expect(typeof output?.entryFileNames).toBe('function')

    })

  })

  describe('input configuration', () => {

    beforeEach(() => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

    })

    it('should set correct input glob pattern', async () => {

      const config = await defineRuntimeConfig({ cwd: mockCwd })

      expect(config.input).toBe('src/wb-rules/*.[jt]s')

    })

  })

  describe('env loader options', () => {

    beforeEach(() => {

      vi.mocked(fs.access).mockResolvedValue(undefined)

    })

    it('should pass env loader options with mode and paths', async () => {

      const envLoaderOptions = {
        prefix: 'CUSTOM_',
      }

      await defineRuntimeConfig({
        cwd: mockCwd,
        envLoader: envLoaderOptions,
      })

      expect(loadEnvReplacements).toHaveBeenCalledWith({
        prefix: 'CUSTOM_',
        mode: process.env.NODE_ENV ?? 'development',
        cwd: mockCwd,
        rootDir: mockRootDir,
      })

    })

    it('should use default env loader when options not provided', async () => {

      await defineRuntimeConfig({ cwd: mockCwd })

      expect(loadEnvReplacements).toHaveBeenCalledWith({
        mode: process.env.NODE_ENV ?? 'development',
        cwd: mockCwd,
        rootDir: mockRootDir,
      })

    })

  })

})
