/**
 * Путь к сокету изолированного ssh-agent.
 * Используется только в shell-командах — символ `~` раскрывается в shell.
 *
 * @since 0.4.0
 *
 **/
export const SSH_AUTH_SOCK = '~/.ssh/mirta-agent.sock'

/**
 * Время жизни ключа, используемое в ssh-agent по умолчанию.
 *
 * @since 0.4.0
 *
 **/
export const DEFAULT_SSH_KEY_TTL = '15m'
