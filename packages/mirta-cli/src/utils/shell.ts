import { spawn, type IOType, type SpawnOptions } from 'node:child_process'
import type { WslDistroName } from '#src/config/types'
import { logger } from '#utils/logger'

/**
 * Режим `stdio`: ввод и вывод перенаправляются в `stdin`, `stdout` и `stderr` соответственно.
 *
 * @since 0.4.5
 *
 **/
export const STDIO_PIPED: IOType[] = ['pipe', 'pipe', 'pipe']

/**
 * Режим `stdio`: ввод и вывод наследуются от родительского процесса (терминал), `stderr` перехватывается.
 *
 * Используется, когда важно видеть прогресс команды (например, `rsync`).
 *
 * @since 0.4.0
 *
 **/
export const STDIO_INTERACTIVE: IOType[] = ['inherit', 'inherit', 'pipe']

/**
 * Режим `stdio`: ввод игнорируется, `stdout` и `stderr` перехватываются.
 *
 * Используется для полного захвата вывода команды.
 *
 * @since 0.4.0
 *
 **/
export const STDIO_CAPTURE_OUTPUT: IOType[] = ['ignore', 'pipe', 'pipe']

/**
 * Режим `stdio`: ввод и `stdout` игнорируются, `stderr` перехватывается.
 * Используется для проверки ошибок без сохранения основного вывода.
 *
 * @since 0.4.0
 *
 **/
export const STDIO_CAPTURE_ERRORS: IOType[] = ['ignore', 'ignore', 'pipe']

/**
 * Ошибка выполнения команды в shell.
 *
 * Возникает, когда команда завершилась с кодом, не входящим в `doneCodes` или `cancelCodes`.
 *
 **/
export class ShellError extends Error {
  constructor(message: string) {

    super(message)

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, ShellError.prototype)

    this.name = 'ShellError'
    this.message = message

    Error.captureStackTrace(this, ShellError)

  }
}

/**
 * Ошибка, указывающая на отмену операции (например, через Ctrl+C).
 *
 * Соответствует коду выхода 130 (SIGINT).
 *
 * @since 0.4.0
 *
 **/
export class OperationCanceledError extends Error {
  constructor() {

    super()

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, OperationCanceledError.prototype)

    this.name = 'OperationCanceledError'

    Error.captureStackTrace(this, OperationCanceledError)

  }
}

/**
 * Результат выполнения команды.
 *
 **/
export interface ExecutionResult {

  /**
   * Успешно завершена ли команда (код в `doneCodes`).
   *
   **/
  isDone: boolean

  /**
   * Код завершения процесса.
   *
   **/
  code: number

  /**
   * Перехваченный стандартный вывод.
   *
   **/
  stdout: string

  /**
   * Перехваченный стандартный поток ошибок.
   *
   **/
  stderr: string
}

/**
 * Расширенные опции для запуска команды.
 *
 * @since 0.4.0
 *
 **/
interface RunOptions extends SpawnOptions {

  /**
   * Коды завершения, считающиеся успешными (по умолчанию: `[0]`).
   *
   **/
  doneCodes?: number[]

  /**
   * Коды завершения, интерпретируемые как отмена (по умолчанию: `[130]` — SIGINT).
   *
   **/
  cancelCodes?: number[]

  /**
   * Ввод для команды (требует pipe для stdin).
   *
   * @since 0.4.5
   *
   **/
  input?: string

}

/**
 * Асинхронно выполняет команду и возвращает результат.
 *
 * Перехватывает `stdout` и `stderr`.
 * Поддерживает кастомные коды успеха и отмены.
 *
 * @param command - Команда (например, `ls`, `rsync`).
 * @param args - Аргументы команды.
 * @param options - Опции запуска процесса.
 * @returns Результат выполнения: код, вывод, ошибки.
 * @throws {ShellError} Если команда завершилась с ошибкой.
 * @throws {OperationCanceledError} Если операция была отменена пользователем.
 *
 **/
export async function execAsync(
  command: string,
  args: string[] = [],
  options: RunOptions = {}
): Promise<ExecutionResult> {

  return new Promise((resolve, reject) => {

    const { doneCodes = [0], cancelCodes = [130], input, ...spawnOptions } = options

    spawnOptions.stdio ??= STDIO_CAPTURE_OUTPUT
    spawnOptions.shell ??= false

    if (input && spawnOptions.stdio[0] !== 'pipe') {

      reject(
        new ShellError(
          'Input can only be piped to stdin when stdio[0] is set to "pipe"'
        )
      )

      return

    }

    const runner = spawn(command, args, spawnOptions)

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    runner.stdout?.on('data', (chunk: Buffer) => {

      stdoutChunks.push(chunk)

    })

    runner.stderr?.on('data', (chunk: Buffer) => {

      stderrChunks.push(chunk)

    })

    if (input) {

      runner.stdin?.on('error', reject)

      runner.stdin?.write(input)
      runner.stdin?.end()

    }

    runner.on('error', reject)

    runner.on('exit', (code) => {

      const isDone = code !== null && doneCodes.includes(code)

      const stdout = Buffer.concat(stdoutChunks).toString().trim()
      const stderr = Buffer.concat(stderrChunks).toString().trim()

      if (isDone) {

        resolve({ isDone, code, stdout, stderr })

      }
      else {

        const isCanceled = code !== null && cancelCodes.includes(code)

        reject(
          isCanceled
            ? new OperationCanceledError()
            : new ShellError(
                `Failed to execute command ${command} ${args.join(' ')}: ${stderr}`
              )
        )

      }

    })

  })

}

/**
 * Тип функции для асинхронного запуска команды.
 *
 * @since 0.4.0
 *
 **/
export type RunAsync = (command: string, args?: string[], options?: RunOptions) => Promise<ExecutionResult>

/**
 * Интерфейс для универсального запуска команд с дополнительными режимами.
 *
 * Поддерживает:
 * - Запуск в Unix-среде (через WSL2 на Windows)
 * - Симуляцию без реального выполнения
 *
 * @since 0.4.0
 *
 **/
interface RunCommandAsync extends RunAsync {

  /**
   * Возвращает функцию запуска, которая автоматически оборачивает команду в WSL2 при необходимости.
   *
   * @param wsl - Имя дистрибутива WSL2 (опционально).
   * @returns Функция `RunAsync`, выполняющая команды в нужной среде.
   *
   **/
  inUnixShell: (wsl?: WslDistroName) => RunAsync

  /**
   * Возвращает функцию запуска в режиме симуляции.
   *
   * При вызове логирует команду и возвращает успех без выполнения.
   *
   * @param isDryRun - Включить ли режим симуляции.
   * @returns Функция `RunAsync`, имитирующая выполнение.
   *
   **/
  dry: (isDryRun: boolean) => RunAsync

}

/**
 * Универсальная функция для запуска команд.
 *
 * Расширяется методами:
 * - `.inUnixShell()` — для выполнения в WSL2
 * - `.dry()` — для режима симуляции
 *
 **/
const runCommandAsync: RunCommandAsync = async (
  command: string,
  args?: string[],
  options: RunOptions = {}
) => await execAsync(command, args, { ...options })

runCommandAsync.inUnixShell = (wsl?: WslDistroName): RunAsync => (
  command,
  args = [],
  options = {}
) => {

  let cmd: string
  let fullArgs: string[] = []

  if (process.platform === 'win32') {

    cmd = 'wsl'

    if (wsl)
      fullArgs.push('-d', wsl)

    if (options.env) {

      for (const [key, value] of Object.entries(options.env)) {

        fullArgs.push(`${key}=${value}`)

      }

    }

    fullArgs.push(command, ...args)

  }
  else {

    cmd = command
    fullArgs = args

  }

  return execAsync(cmd, fullArgs, { ...options })

}

runCommandAsync.dry = (isDryRun?: boolean): RunAsync => {

  if (isDryRun === false)
    return runCommandAsync

  return (command, args = []): Promise<ExecutionResult> => {

    logger.info(`${command} ${args.join(' ')}`.trimEnd() + ' (DRY RUN)')

    return Promise.resolve({
      isDone: true,
      code: 0,
      stdout: '',
      stderr: '',
    })

  }

}

export {
  runCommandAsync
}
