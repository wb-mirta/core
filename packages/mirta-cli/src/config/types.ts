/**
 * Путь к модулю PKCS#11 (например, для Rutoken).
 * Отличается от обычной строки для предотвращения передачи некорректных значений.
 *
 * @since 0.4.0
 *
 **/
export type Pkcs11Path = Branded<string, 'Pkcs11Path'>

/**
 * Путь к приватному SSH-ключу.
 * Используется для аутентификации через ssh-agent.
 *
 * @since 0.4.0
 *
 **/
export type KeyPath = Branded<string, 'KeyPath'>

/**
 * Время жизни ключа или токена в формате OpenSSH (например, '30m', '1h', '1h30m').
 * Поддерживается в параметрах подключения.
 *
 * @since 0.4.0
 *
 **/
export type TimeToLive = Branded<string, 'TimeToLive'>

/**
 * Имя дистрибутива WSL2 (например, 'Ubuntu-22.04').
 * Используется для выполнения команд в нужной среде на Windows.
 *
 * @since 0.4.0
 *
 **/
export type WslDistroName = Branded<string, 'WslDistro'>

/**
 * Описание подключения к удалённому хосту по SSH.
 *
 * Поддерживает:
 * - PKCS#11 токен
 * - Приватный ключ
 * - Указание TTL для ключа
 * - Выполнение через WSL2
 *
 * @since 0.4.0
 *
 **/
export interface MirtaConnection extends Record<string, unknown> {

  /**
   * Тип подключения. На данный момент поддерживается только 'ssh'.
   *
   **/
  type: string

  /**
   * Адрес хоста (IP или домен).
   *
   **/
  hostname: string

  /**
   * Порт SSH (по умолчанию 22).
   *
   **/
  port?: number

  /**
   * Имя пользователя (по умолчанию 'root').
   *
   **/
  username?: string

  /**
   * Путь к библиотеке PKCS#11 (например, `/usr/lib/librtpkcs11ecp.so`).
   *
   **/
  pkcs11?: Pkcs11Path

  /**
   * Путь к приватному SSH-ключу.
   *
   **/
  key?: KeyPath

  /**
   * Время жизни ключа в ssh-agent (например, '30m', '1h', '1h30m').
   *
   **/
  ttl?: TimeToLive

  /**
   * Имя дистрибутива WSL2 для выполнения команд на Windows.
   *
   **/
  wsl?: WslDistroName

}

/**
 * Исходный путь для синхронизации (относительно корня проекта).
 * Отличается от обычной строки для типобезопасности.
 *
 * @since 0.4.0
 *
 **/
export type DeployFrom = Branded<string, 'DeployFrom'>

/**
 * Целевой путь на контроллере (абсолютный).
 * Отличается от обычной строки для типобезопасности.
 *
 * @since 0.4.0
 *
 **/
export type DeployTo = Branded<string, 'DeployTo'>

/**
 * Правило синхронизации файлов при деплое.
 * Определяет, что и куда копируется, и с какими опциями.
 *
 * @since 0.4.0
 *
 **/
export interface DeployMapping {

  /**
   * Включено ли правило. По умолчанию — `true`.
   *
   **/
  enabled?: boolean

  /**
   * Исходный путь (относительно cwd).
   *
   **/
  from: DeployFrom

  /**
   * Целевой путь на контроллере (абсолютный).
   *
   **/
  to: DeployTo

  /**
   * Целевая группа для установки прав доступа к файлам.
   *
   **/
  toGroup?: string

  /**
   * Удалять ли лишние файлы на контроллере (аналог `--delete` в `rsync`).
   *
   **/
  cleanup?: boolean

  /**
   * Список шаблонов путей, которые НЕ должны удаляться при `cleanup: true`.
   * Передаётся как `--filter 'P pattern'`.
   *
   **/
  protect?: string[]

  /**
   * Список шаблонов для исключения из синхронизации.
   * Передаётся как `--exclude`.
   *
   **/
  exclude?: string[]
}

/**
 * Профиль деплоя — набор настроек для конкретной среды (например, 'home', 'work').
 */
export interface DeployProfile {

  /**
   * Имя подключения (из `connections`) или строка подключения.
   *
   **/
  connection?: string

  /**
   * Список имён маппингов (из `deploy.mappings`), которые нужно применить.
   *
   **/
  mappings?: string[]

  /**
   * Группа по умолчанию для файлов, если не указана в маппинге.
   *
   **/
  toGroup?: string

}

/**
 * Конфигурация деплоя.
 *
 * @since 0.4.0
 *
 **/
export interface DeployConfig {

  /**
   * Коллекция переиспользуемых маппингов.
   * Ключ — имя маппинга, значение — массив правил.
   *
   **/
  mappings?: Record<string, DeployMapping[]>

  /**
   * Профили деплоя — предустановленные конфигурации для разных окружений.
   *
   **/
  profiles?: Record<string, DeployProfile>

}

/**
 * Конфигурация проекта (шаблоны, ресурсы и т.д.).
 *
 * @since 0.4.0
 *
 **/
export interface ProjectConfig {

  /**
   * Список путей к директориям с шаблонами.
   *
   * Используется при создании новых проектов.
   *
   **/
  templates?: string[]

}

/**
 * Основной объект конфигурации Mirta CLI.
 *
 * Корневой тип для `mirta.config.json`.
 *
 * @since 0.4.0
 *
 **/
export interface MirtaConfig {

  /**
   * Именованные подключения к контроллерам.
   * Ключ — имя, значение — строка или объект подключения.
   *
   **/
  connections?: Record<string, string | Record<string, unknown>>

  /**
   * Настройки деплоя: маппинги, профили.
   *
   **/
  deploy?: DeployConfig

  /**
   * Настройки проекта: шаблоны и т.д.
   *
   **/
  project?: ProjectConfig

}
