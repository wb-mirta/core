import { fileURLToPath } from 'node:url'
import { promises, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import merge from 'lodash.merge'

const fallbackLocale = 'en-US'
const localesPath = './locales'

let currentLocale = ''

export interface LocalizedItem {
  message: string
  hint?: string
  errorMessage?: string
}

export interface LocalizedItemRequired {
  message: string
  required: string
  hint?: string
  errorMessage?: string
}

export interface Localized {
  title: string
  intro: string
  projectName: LocalizedItem
  packageName: LocalizedItem
  shouldOverwrite: {
    directory: {
      current: string
      target: string
    }
    message: string
    confirmDelete: string
  }
  featureSelection: LocalizedItem
  addEslint: LocalizedItem
  addVitest: LocalizedItem
  addStore: LocalizedItem
  validation: {
    required: string
  }
  status: {
    success: string
    error: string
    canceled: string
    scaffolding: string
    scaffolded: string
    installingDependencies: string
  }
  accent: {
    recommended: string
  }
  dependencies: {
    question: string
    current: LocalizedItem
    pnpm: LocalizedItem
    yarn: LocalizedItem
    npm: LocalizedItem
    bun: LocalizedItem
    no: LocalizedItem
  }
  errors: {
    operationCanceled: string
    rootIsNotRelative: string
  }
}

/**
 *
 * Used to link obtained locale with correct locale file.
 *
 * @param locale Obtained locale
 * @returns locale that linked with correct name
 */
function linkLocale(locale: string) {

  if (locale === 'C')
    return fallbackLocale

  let linkedLocale: string | undefined

  try {

    linkedLocale = Intl.getCanonicalLocales(locale)[0]

  }
  catch (error) {

    console.warn(`${JSON.stringify(error)}, invalid language tag: "${locale}"`)

  }

  switch (linkedLocale) {
    default:
      linkedLocale = locale
  }

  return linkedLocale

}

export function getLocale() {

  if (currentLocale)
    return currentLocale

  const shellLocale
    = process.env.LC_ALL
      ?? process.env.LC_MESSAGES
      ?? process.env.LANG
      ?? Intl.DateTimeFormat().resolvedOptions().locale

  return currentLocale = linkLocale(shellLocale.split('.')[0].replace('_', '-'))

}

async function loadLanguageFile<TLocalized>(filePath: string): Promise<TLocalized | undefined> {

  return await promises.readFile(filePath, 'utf-8').then((content) => {

    const data = JSON.parse(content) as TLocalized | undefined
    return data

  })

}

async function loadLocale(localesRoot: string): Promise<Localized> {

  currentLocale = getLocale()

  const fallbackFilePath = resolve(localesRoot, `${fallbackLocale}.json`)
  const targetFilePath = resolve(localesRoot, `${currentLocale}.json`)

  const messages = await loadLanguageFile<Localized>(fallbackFilePath)

  if (!messages)
    throw Error('Fallback locale file not found.')

  if (existsSync(targetFilePath))
    merge(messages, await loadLanguageFile(targetFilePath))

  return messages

}

let localized: Localized | undefined

export async function getLocalized(): Promise<Localized> {

  const path = fileURLToPath(
    new URL(localesPath, import.meta.url)
  )

  return localized ??= await loadLocale(path)

}
