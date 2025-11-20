import { getSessionId } from './session'
import { StoreError } from './errors'

/**
 * Метаданные определения хранилища для реестра.
 *
 * Содержит информацию о первоначальном вызове `defineStore`, включая:
 * - путь к модулю, где хранилище было определено впервые,
 * - сессии, в которых это определение уже использовалось.
 *
 * @since 0.4.0
 *
 **/
export interface DefinitionMetadata {
  /**
   * Путь к модулю, в котором впервые был вызван `defineStore` данного типа.
   *
   **/
  callerPath: string

  /**
   * Словарь, отслеживающий, в каких сессиях и скриптах `wb-rules` производилась регистрация данного типа.
   *
   * Ключ — абсолютный путь к корневому файлу (`__filename`), значение — идентификатор сессии.
   *
   **/
  sessions: Record<string, string>
}

/**
 * Реестр определений хранилищ.
 * Ключ — идентификатор типа хранилища (`typeId`), значение — метаданные определения.
 *
 * @since 0.4.0
 *
 **/
export type DefinitionsRegistry
  = Record<string, DefinitionMetadata>

/**
 * Пытается определить путь к файлу, вызвавшему `defineStore`, через анализ стека вызовов.
 *
 * Проходит по строкам стека, ищет вызов `defineStore`, а затем в следующей строке
 * извлекает путь к файлу, откуда был совершён вызов.
 *
 * @returns Путь к файлу, вызвавшему `defineStore`, или `undefined`, если определить не удалось.
 *
 * @since 0.4.0
 *
 **/
export function tryGetCallerPath() {

  const errorStack = new Error().stack

  if (!errorStack)
    return

  const stackLines = errorStack.split('\n')

  let foundDefineStore = false

  for (const line of stackLines) {

    // Ищем первую строку, содержащую "defineStore".
    if (!foundDefineStore && line.includes('defineStore')) {

      foundDefineStore = true
      continue

    }

    // После нахождения defineStore берём следующую строку с вызовом.
    if (foundDefineStore) {

      // Извлекаем путь к файлу: ищем шаблон " /путь/к/файлу:строка"
      //
      const fileMatch = /\s([^\s]+?):\d+/.exec(line)

      if (fileMatch)
        return fileMatch[1]

    }

  }

}

/**
 * Получает реестр определений хранилищ из `module.static`.
 *
 * Реестр сохраняется между перезапусками скриптов, что позволяет отслеживать
 * уже определённые типы хранилищ.
 *
 * @returns Реестр определений типа {@link DefinitionsRegistry}.
 *
 * @since 0.4.0
 *
 **/
export function getDefinitionsRegistry() {

  return (module.static.definitions ??= {}) as DefinitionsRegistry

}

/**
 * Обеспечивает уникальность определения типа хранилища.
 *
 * Проверяет, что:
 * 1. Тип хранилища не определён в другом модуле.
 * 2. В текущей сессии и файле для этого типа ещё не вызывался `defineStore`.
 *
 * Если проверки не проходят — выбрасывается соответствующая ошибка.
 *
 * @param typeId - Уникальный идентификатор типа хранилища.
 * @throws {StoreError} Тип уже определён в другом модуле (`alreadyDefinedOutside`).
 * @throws {StoreError} Тип уже определён в текущей сессии (`alreadyDefined`).
 *
 * @since 0.4.0
 *
 **/
export function enforceDefinitionIsUnique(
  typeId: string
) {

  const currentCallerPath = tryGetCallerPath()

  if (!currentCallerPath)
    return

  const registry = getDefinitionsRegistry()

  // Если указанный тип хранилища ещё не зарегистрирован,
  // вносим его в реестр.
  //
  if (!(typeId in registry))
    registry[typeId] = {
      callerPath: currentCallerPath,
      sessions: { },
    }

  const entry = registry[typeId]

  // Проверка 1: тип не определён в другом модуле.
  if (currentCallerPath !== entry.callerPath)
    throw StoreError.get('alreadyDefinedOutside', typeId, entry.callerPath)

  const sessionId = getSessionId()

  // Проверка 2: тип не зарегистрирован в текущей сессии.
  if (entry.sessions[__filename] === sessionId)
    throw StoreError.get('alreadyDefined', typeId)

  // Регистрируем вызов в текущей сессии.
  entry.sessions[__filename] = sessionId

}

/**
 * Сбрасывает внутреннее состояние реестра определений.
 *
 * Используется исключительно в тестах для обеспечения изоляции.
 *
 * @internal
 *
 * @since 0.4.0
 *
 **/
export function __resetInternalState() {

  if (!__TEST__)
    return

  module.static = {
    definitions: {},
  }

}

// Инициализация внутреннего состояния при запуске
// в режиме тестирования.
//
if (__TEST__)
  __resetInternalState()
