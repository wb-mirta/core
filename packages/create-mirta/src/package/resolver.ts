import { prompts } from '#utils/prompts'
import { t } from '#i18n'
import { logger } from '#utils/logger'

/**
 * Информация о пакете, введённая пользователем.
 *
 * @since 0.4.0
 *
 **/
export interface PackageInfo {

  /**
   * Короткое имя пакета (без scope).
   * Пример: 'mirta-thermostat'
   *
   **/
  name: string

  /**
   * Полное имя пакета (с scope, если есть).
   * Пример: '@myorg/mirta-thermostat'
   *
   **/
  fullName: string

  /**
   * Описание пакета (опционально).
   *
   **/
  description?: string
}

function sanitizePart(part: string): string {

  return part
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]+/, '')
    .replace(/[^a-z0-9-]+/g, '-')

}

export function toValidPackageName(value: string): string {

  const cleanValue = value.trim()
  const match = /^(@[^/]+)\/(.+)$/.exec(cleanValue)

  if (!match)
    return sanitizePart(cleanValue)

  const [, scope, name] = match

  const cleanScope = sanitizePart(scope.slice(1)) // убираем @
  const cleanName = sanitizePart(name)

  return `@${cleanScope}/${cleanName}`

}

export function isValidPackageName(packageName: string) {

  return /^(?:@[a-z0-9-][a-z0-9-._]*\/)?[a-z0-9-][a-z0-9-._]*$/
    .test(packageName)

}

export async function resolvePackageInfoAsync(
  input?: string
): Promise<PackageInfo> {

  let packageName: string | undefined

  if (input && isValidPackageName(input)) {

    packageName = input

  }
  else {

    logger.step(t('package.caption'))

    const answer = await prompts({
      type: 'text',
      name: 'packageName',
      message: t('packageName.prompt'),
      initial: input
        ? toValidPackageName(input)
        : undefined,
      validate: (value: string) =>
        isValidPackageName(value)
          ? true
          : t(`packageName.invalidFormat`),
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
