import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { readPackageAsync } from '@mirta/package'

// Конфигурация
const INPUT = 'locales/en-US.json'
const OUTPUT_DIR = 'src/i18n'
const OUTPUT_FILE = 'locale-shape.gen.ts'

export function extractBalanced(message, index, limit) {

  if (message[index] !== '{')
    return null

  let depth = 1

  let i = index + 1

  let nameEnd = i
  let hasComma = false

  while (i < limit && depth > 0) {

    if (message[i] === '{')
      depth++
    else if (message[i] === '}')
      depth--

    i++

    if (!hasComma) {

      if (message[i - 1] === ',')
        hasComma = true

      nameEnd++

    }

  }

  if (depth !== 0)
    return null

  return {
    end: i,
    content: message.slice(index + 1, nameEnd - 1),
  }

}

// Извлечение переменных
function extractVariables(message) {

  const vars = new Set()

  let pos = 0
  const len = message.length

  while (pos < len) {

    if (message[pos] === '{') {

      const block = extractBalanced(message, pos, len)

      if (!block) {

        pos++

        continue

      }

      const { content, end } = block

      vars.add(content.trim())

      pos = end

    }
    else {

      pos++

    }

  }

  return [...vars]

}

// Определяем тип переменной: если в plural/select → number, иначе string | number
function getVarType(message, varName) {

  const pluralRegex = new RegExp(`\\{\\s*${varName}\\s*,\\s*plural`, 'g')
  const selectRegex = new RegExp(`\\{\\s*${varName}\\s*,\\s*select`, 'g')

  if (pluralRegex.test(message) || selectRegex.test(message))
    return 'number'

  return 'string | number'

}

async function generate() {

  const cwd = process.cwd()
  const inputPath = resolve(cwd, INPUT)
  const outputDirPath = resolve(cwd, OUTPUT_DIR)
  const outputPath = resolve(outputDirPath, OUTPUT_FILE)

  try {

    const content = await readFile(inputPath, 'utf-8')
    const json = JSON.parse(content)

    // Фильтрация: только строковые значения
    const validEntries = Object.entries(json).filter(([key, value]) => {

      if (typeof value !== 'string') {

        console.warn(`⚠️  [i18n] Value for '${key}' is not a string — ignored`)
        return false

      }

      return true

    })

    if (validEntries.length === 0) {

      console.log(`⏭️  [i18n] No valid string entries in ${INPUT} — skipped`)
      return

    }

    const messages = {}
    const variables = {}

    for (const [key, message] of validEntries) {

      messages[key] = message

      const vars = extractVariables(message)

      if (vars.length === 0) {

        variables[key] = {}

      }
      else {

        variables[key] = Object.fromEntries(
          vars.map(varName => [varName, getVarType(message, varName)])
        )

      }

    }

    const indent = ''.padEnd(4)

    const sortedKeys = validEntries.map(([key]) => key).sort()

    const messagesBody = sortedKeys
      .map(key => `${indent}'${key}': string`)
      .join('\n')

    const variablesBody = sortedKeys
      .map((key) => {

        const varTypes = variables[key]

        const props = Object.entries(varTypes).map(([varName, type]) => `${indent}  '${varName}': ${type}`)

        if (props.length === 0)
          return `${indent}'${key}': {}`

        return `${indent}'${key}': {\n${props.join('\n')}\n${indent}}`

      })
      .join('\n')

    const pkg = await readPackageAsync(cwd)

    const header = `/**
 * @fileoverview Автоматически генерируемый интерфейс локализованных сообщений на основе \`locales/en-US.json\`.
 *
 * Содержит:
 * - \`messages\`: тексты сообщений (ICU-формат),
 * - \`variables\`: обязательные переменные для каждого ключа.
 *
 * **Источник генерации:** \`./scripts/i18n/shape-gen.mjs\`
 *
 * **Пакет:** \`${pkg.name ?? basename(cwd)}\`
 *
 * **Дата генерации:** \`${new Date().toISOString()}\`
 *
 * ⚠️ Этот файл обновляется автоматически. Не редактируйте его вручную.
 *
 **/
`

    const typeDef = `${header}
/**
 *
 * Контракт локализации \`${pkg.name ?? basename(cwd)}\` для подсистемы \`@mirta/i18n\`.
 *
 * Автоматически сгенерирован на основе \`./locales/en-US.json\`.
 *
 * Используется в \`initLocalization<LocaleShape>\`.
 *
 **/
export interface LocaleShape {

  /** Локализованные строки (ICU MessageFormat). */
  messages: {
${messagesBody}
  }

  /** Обязательные переменные для каждого сообщения. */
  variables: {
${variablesBody}
  }

}

// Машинночитаемый маркер (не удалять)
// GENERATED: i18n-shape-gen:v1
`

    // Создаём папку, если не существует
    await mkdir(outputDirPath, { recursive: true })

    await writeFile(outputPath, typeDef, 'utf-8')
    console.log(`✅ [i18n] Generated: ${outputPath}`)

  }
  catch (error) {

    if (error.code === 'ENOENT') {

      console.log(`⏭️  [i18n] Source file not found: ${inputPath} — skipped`)
      return

    }
    console.error(`❌ [i18n] Failed to generate types: ${error.message}`, error)
    process.exit(1)

  }

}

generate()
