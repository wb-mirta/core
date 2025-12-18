/**
 * Путь к сокету изолированного ssh-agent.
 * Используется только в shell-командах — символ `~` раскрывается в shell.
 *
 * @since 0.4.0
 *
 **/
export const MIRTA_SSH_AUTH_SOCK = '~/.ssh/mirta-agent.sock'

/**
 * Контекст выполнения команд в изолированном экземпляре ssh-agent.
 * Используется как префикс в runAsync() для всех операций с агентом.
 *
 * Обеспечивает:
 * - Изоляцию от системного ssh-agent
 * - Единое пространство сокетов и ключей
 * - Безопасное управление токенами и ключами
 *
 * @example
 * ```ts
 * await runAsync(MIRTA_AGENT_BINDING, ['ssh-add', '-l'])
 * await runAsync(MIRTA_AGENT_BINDING, ['rsync', '-e', 'ssh', ...])
 * ```
 * @since 0.4.0
 *
 **/
export const MIRTA_AGENT_BINDING = `SSH_AUTH_SOCK=${MIRTA_SSH_AUTH_SOCK}`

/**
 * Время жизни ключа, используемое в ssh-agent по умолчанию.
 *
 * @since 0.4.0
 *
 **/
export const DEFAULT_SSH_KEY_TTL = '15m'
