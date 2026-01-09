import { prompts } from '#utils/prompts'
import { t } from '#i18n'
import { logger } from '#utils/logger'

const MAX_LENGTH = 214

/**
 * Информация о пакете, введённая пользователем.
 *
 * @since 0.4.0
 *
 **/
export interface PackageInfo {

  /**
   * Короткое имя пакета (без scope).
   *
   * Используется в путях, именах папок, локальных ссылках.
   *
   * @example 'mirta-thermostat'
   *
   **/
  name: string

  /**
   * Полное имя пакета (с scope, если есть).
   *
   * Соответствует формату, используемому в npm: `@scope/name` или `name`.
   *
   * @example '@myorg/mirta-thermostat'
   *
   **/
  fullName: string
}

/**
 * Проверяет, что длина имени пакета не превышает разрешённую величину.
 *
 * @since 0.4.0
 *
 **/
export function hasValidLength(packageName: string) {

  return packageName.length <= MAX_LENGTH

}

/**
 * Проверяет, является ли строка валидным именем NPM-пакета.
 *
 * Поддерживает как обычные, так и scoped-имена.
 * Основывается на официальных правилах именования пакетов в npm.
 *
 * @param packageName - Проверяемая строка
 * @returns `true`, если имя валидно, иначе `false`
 *
 * @example
 * ```ts
 * hasValidFormat('my-package')   // → true
 * hasValidFormat('@org/module')  // → true
 * hasValidFormat('invalid/name') // → false
 * ```
 * @since 0.4.0
 *
 **/
export function hasValidFormat(packageName: string) {

  return /^(?:@[a-z0-9-][a-z0-9-._]*\/)?[a-z0-9-][a-z0-9-._]*$/
    .test(packageName)

}

/**
 * Внутренняя функция, нормализующая часть имени пакета (scope или имя).
 *
 * Преобразует строку к нижнему регистру, заменяет все недопустимые символы
 * на дефисы, удаляет дефисы в начале и конце, а также схлопывает
 * последовательные дефисы в один.
 *
 * @param input - Часть имени (например, scope или basename)
 * @returns Очищенное имя, готовое к использованию в package.json
 *
 * @example
 * sanitizePart('My_Module') // → 'my-module'
 * sanitizePart('__test..')   // → 'test'
 *
 * @since 0.4.0
 *
 **/
function sanitizePart(input: string): string {

  return input
    .toLowerCase()
    // 1. Всё, что не разрешено → дефис (включая пробелы, _, .)
    .replace(/[^a-z0-9]+/g, '-')
    // 2. Убираем лишние дефисы: в начале и в конце
    .replace(/^-+|-+$/g, '')

}

/**
 * Преобразует произвольную строку в корректное имя NPM-пакета.
 *
 * Поддерживает scoped-пакеты (начинающиеся с `@scope/`).
 * Проводит валидацию и очистку как scope, так и имени.
 * Если scope пустой после очистки — возвращается только имя.
 *
 * @param input - Исходная строка (например, ввод пользователя)
 * @returns Валидное имя пакета, готовое к использованию в `package.json`
 *
 * @example
 * ```ts
 * toValidPackageName('My Package')       // → 'my-package'
 * toValidPackageName('@My Org/Tool!')    // → '@my-org/tool'
 * toValidPackageName('@/invalid')        // → 'invalid' (scope пуст)
 * ```
 * @since 0.4.0
 *
 **/
export function toValidPackageName(input: string): string {

  const cleanInput = input.trim()
  const match = /^(@[^/]+)\/(.+)$/.exec(cleanInput)

  if (!match)
    return sanitizePart(cleanInput)

  const [, scope, name] = match

  const cleanScope = sanitizePart(scope.slice(1)) // убираем @
  const cleanName = sanitizePart(name)

  return cleanScope.length > 0
    ? `@${cleanScope}/${cleanName}`
    : cleanName

}

/**
 * Асинхронно запрашивает у пользователя информацию о пакете.
 *
 * Если передано валидное имя — используется оно.
 * Иначе — показывается интерактивный ввод с валидацией.
 * Автоматически нормализует ввод через `toValidPackageName`.
 *
 * @param input - Опциональное имя пакета (например, из аргументов команды)
 * @returns Объект с полями `name` и `fullName`.
 *
 * @throws Может выбросить ошибку, если прерван ввод (редкий случай)
 *
 * @example
 * ```ts
 * const info = await resolvePackageInfoAsync('my-module')
 * console.log(info.fullName) // → 'my-module'
 * ```
 * @since 0.4.0
 *
 **/
export async function resolvePackageInfoAsync(
  input?: string
): Promise<PackageInfo> {

  let packageName: string | undefined

  if (input && hasValidLength(input) && hasValidFormat(input)) {

    packageName = input

  }
  else {

    logger.step(t('package.caption'))

    const answer = await prompts({
      type: 'text',
      name: 'packageName',
      message: t('packageName.prompt'),
      initial: input
        ? toValidPackageName(input) || undefined
        : undefined,
      validate: (value: string) => {

        if (!hasValidLength(value))
          return t('packageName.tooLong', { maxLength: MAX_LENGTH })

        if (!hasValidFormat(value))
          return t(`packageName.invalidFormat`)

        return true

      },

    }) as { packageName: string }

    packageName = answer.packageName

  }

  const scopeMatch = /^@([^/]+)\/(.+)$/.exec(packageName)

  return {

    // Короткое название пакета
    name: scopeMatch ? scopeMatch[2] : packageName,

    // Полное название пакета
    fullName: packageName,

  }

}
