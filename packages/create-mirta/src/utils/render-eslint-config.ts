import renderEjs from './render-ejs'
import thisPackage from '../../package.json' with { type: 'json' }
import { resolve } from 'node:path'
import renderJson from './render-json'
import sortDependencies from './sort-dependencies'
import { writeFileSync } from 'node:fs'
import deepMerge from './deep-merge'

function pickExisting(source: Record<string, string>, keys: string[]) {

  return keys.reduce<Record<string, string>>((acc, key) => {

    if (key in source)
      acc[key] = source[key]

    return acc

  }, {})

}

const devDependencies = thisPackage.devDependencies

const pickDependencies = (keys: string[]) =>
  pickExisting(devDependencies, keys)

interface AdditionalConfig {
  devDependencies?: Record<string, string>
}

interface CreateConfigOptions {
  styleGuide?: 'default' | 'airbnb' | 'standard'
  addVitest?: boolean
  additionalConfigs?: AdditionalConfig[]
}

function createConfig(templateDir: string, options: CreateConfigOptions = {}) {

  const {
    styleGuide = 'default',
    addVitest,
    additionalConfigs = [],
  } = options

  const pkg = {
    devDependencies: pickDependencies([
      '@eslint/js',
      '@stylistic/eslint-plugin',
      'eslint',
      'globals',
      'typescript-eslint',
    ]),
    scripts: {},
  }

  const fileExtensions = ['ts', 'mts', 'tsx']

  if (addVitest) {

    additionalConfigs.unshift({
      devDependencies: pickDependencies(['eslint-plugin-vitest']),
    })

  }

  for (const config of additionalConfigs) {

    deepMerge(pkg.devDependencies, config.devDependencies ?? {})

  }

  const templateData = {
    styleGuide,
    addVitest,
    fileExtensions,
  }

  function renderEjsEntry(fileName: string) {

    const filePath = resolve(templateDir, fileName)

    return [
      fileName.replace(/\.ejs$/, ''),
      renderEjs(filePath, templateData),
    ]

  }

  const entries = [
    renderEjsEntry('eslint.config.mjs.ejs'),
  ]

  return {
    pkg,
    files: Object.fromEntries(entries) as Record<string, string>,
  }

}

interface RenderEslintOptions {
  addVitest?: boolean
}

export default function renderEslintConfig(
  templateRoot: string,
  rootDir: string,
  options: RenderEslintOptions = {}
) {

  const { addVitest } = options
  const templateDir = resolve(templateRoot, 'eslint')

  const { pkg, files } = createConfig(templateDir, {
    styleGuide: 'default',
    addVitest,
  })

  const targetPkgPath = resolve(rootDir, 'package.json')

  renderJson(pkg, targetPkgPath, result => sortDependencies(result))

  for (const [fileName, content] of Object.entries(files)) {

    const fullPath = resolve(rootDir, fileName)
    writeFileSync(fullPath, content, 'utf-8')

  }

}
