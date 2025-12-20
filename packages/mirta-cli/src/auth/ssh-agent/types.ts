import type { Pkcs11Path, KeyPath, TimeToLive } from '#src/config/types'
import type { RunAsync } from '#src/utils/shell'

/**
 * Контекст выполнения операций с SSH-агентом.
 *
 * Содержит параметры аутентификации и метод для выполнения команд в нужной среде (локально или в WSL2).
 * Используется для управления добавлением токенов (PKCS#11) или ключей в ssh-agent.
 *
 * @since 0.4.0
 *
 **/
export interface AgentContext {

  /**
   * Путь к модулю PKCS#11 (например, для Rutoken).
   * Если указан, имеет приоритет над `key`.
   *
   **/
  pkcs11?: Pkcs11Path

  /**
   * Путь к приватному SSH-ключу.
   * Используется, если не задан `pkcs11`.
   *
   **/
  key?: KeyPath

  /**
   * Время жизни токена или ключа в ssh-agent (в формате OpenSSH: 30m, 1h, 1h30m, 2d).
   * Применяется при добавлении в агент через `ssh-add -t`.
   *
   **/
  ttl?: TimeToLive

  /**
   * Функция для выполнения команд в нужной среде (обычно внутри WSL2 на Windows).
   * Обеспечивает совместимость между платформами.
   *
   **/
  runAsync: RunAsync

}
