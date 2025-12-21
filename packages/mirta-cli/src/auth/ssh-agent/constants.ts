import { expandHomeDir } from '#src/utils/file-system'

/**
 * Базовая директория для SSH-файлов в зависимости от платформы.
 *
 * На Unix-системах — домашняя директория пользователя.
 * На Windows — используется символ `~`, который раскрывается в оболочке.
 *
 * Используется для формирования пути к сокету SSH-агента.
 *
 * @since 0.4.0
 *
 **/
export const SSH_DIR = expandHomeDir('~/.ssh')

/**
 * Путь к сокету изолированного ssh-agent.
 *
 * @since 0.4.0
 *
 **/
export const SSH_AUTH_SOCK = SSH_DIR + '/mirta-agent.sock'

/**
 * Время жизни ключа, используемое в ssh-agent по умолчанию.
 *
 * @since 0.4.0
 *
 **/
export const DEFAULT_SSH_KEY_TTL = '15m'
