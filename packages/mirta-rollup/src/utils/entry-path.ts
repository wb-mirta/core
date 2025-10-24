const packagesPattern = /(.*)node_modules[\\/]@?(.+)[\\/](.+)?/

const entryMatchers = {

  'wb-rules': /(?:src[\\/])?wb-rules[\\/](.*)/,
  'wb-rules-modules': /(?:src[\\/])?wb-rules-modules[\\/](.*)/,

} as const

/**
 * Парсит путь к исходному файлу и возвращает имя модуля формата `wb-rules-modules/...`.
 * Используется для обработки путей внутри node_modules.
 *
 * @param sourcePath - путь к исходному файлу
 * @returns Строка с именем модуля или undefined
 *
 * @since 0.3.2
 *
 **/
function tryGetPackageEntryPath(sourcePath: string) {

  const pathParts: string[] = []

  do {

    const match = packagesPattern.exec(sourcePath)

    if (!match)
      break

    if (match[3])
      pathParts.unshift(match[3])

    pathParts.unshift('packages/' + match[2].replace(/\/dist$/, ''))

    sourcePath = match[1]

  }
  while (sourcePath)

  if (pathParts.length)
    return `wb-rules-modules/${pathParts.join('/')}.js`

}

/**
 * Определяет имя входного файла для типов `wb-rules` и `wb-rules-modules`.
 *
 * @param sourcePath - путь к исходному файлу
 * @param type - тип модуля (wb-rules или wb-rules-modules)
 * @returns Строка с именем файла или undefined
 *
 * @since 0.3.5
 *
 **/
function tryGetEntryPath(sourcePath: string, type: 'wb-rules' | 'wb-rules-modules') {

  const match = entryMatchers[type].exec(sourcePath)

  if (!match)
    return

  return `${type}/${match[1]}.js`

}

/**
 * Проверяет различные сценарии и возвращает корректный путь выходного файла.
 *
 * @param filePath - Исходный путь к файлу.
 * @returns Строка с корректным путём.
 *
 * @since 0.3.0
 *
 **/
export function getEntryPath(filePath: string) {

  if (filePath.startsWith('_virtual'))
    return filePath

  return tryGetPackageEntryPath(filePath)
    ?? tryGetEntryPath(filePath, 'wb-rules-modules')
    ?? tryGetEntryPath(filePath, 'wb-rules')
    // None of the above matched.
    ?? filePath

}
