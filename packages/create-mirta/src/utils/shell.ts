import { OperationCanceledError } from '#errors/operation';
import { spawn, type IOType, type SpawnOptions } from 'node:child_process';

/**
 * Режим `stdio`: ввод и вывод наследуются от родительского процесса (терминал), `stderr` перехватывается.
 *
 * Используется, когда важно видеть прогресс команды (например, `rsync`).
 *
 * @since 0.4.0
 *
 **/
export const STDIO_INTERACTIVE: IOType[] = ['inherit', 'inherit', 'pipe'];

/**
 * Режим `stdio`: ввод игнорируется, `stdout` и `stderr` перехватываются.
 *
 * Используется для полного захвата вывода команды.
 *
 * @since 0.4.0
 *
 **/
export const STDIO_CAPTURE_OUTPUT: IOType[] = ['ignore', 'pipe', 'pipe'];

/**
 * Режим `stdio`: ввод и `stdout` игнорируются, `stderr` перехватывается.
 * Используется для проверки ошибок без сохранения основного вывода.
 *
 * @since 0.4.0
 *
 **/
export const STDIO_CAPTURE_ERRORS: IOType[] = ['ignore', 'ignore', 'pipe'];

/**
 * Ошибка выполнения команды в shell.
 *
 * Возникает, когда команда завершилась с кодом, не входящим в `doneCodes` или `cancelCodes`.
 *
 * @since 0.4.0
 *
 **/
export class ShellError extends Error {
  constructor(message: string) {

    super(message);

    this.name = 'ShellError';

    Error.captureStackTrace(this, ShellError);

  }
}

/**
 * Результат выполнения команды.
 *
 * @since 0.4.0
 *
 **/
interface ExecutionResult {

  /**
   * Успешно завершена ли команда (код в `doneCodes`).
   *
   **/
  isDone: boolean;

  /**
   * Код завершения процесса.
   *
   **/
  code: number;

  /**
   * Перехваченный стандартный вывод.
   *
   **/
  stdout: string;

  /**
   * Перехваченный стандартный поток ошибок.
   *
   **/
  stderr: string;
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
  doneCodes?: number[];

  /**
   * Коды завершения, интерпретируемые как отмена (по умолчанию: `[130]` — SIGINT).
   *
   **/
  cancelCodes?: number[];

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
 * @since 0.4.0
 *
 **/
export async function execAsync(
  command: string,
  args: string[] = [],
  options: RunOptions = {}
): Promise<ExecutionResult> {

  return new Promise((resolve, reject) => {

    const { doneCodes = [0], cancelCodes = [130], ...spawnOptions } = options;

    spawnOptions.stdio ??= STDIO_CAPTURE_OUTPUT;
    spawnOptions.shell ??= false;

    const runner = spawn(command, args, spawnOptions);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    runner.stdout?.on('data', (chunk: Buffer) => {

      stdoutChunks.push(chunk);

    });

    runner.stderr?.on('data', (chunk: Buffer) => {

      stderrChunks.push(chunk);

    });

    runner.on('error', reject);

    runner.on('exit', (code) => {

      const isDone = code !== null && doneCodes.includes(code);

      const stdout = Buffer.concat(stdoutChunks).toString().trim();
      const stderr = Buffer.concat(stderrChunks).toString().trim();

      if (isDone) {

        resolve({ isDone, code, stdout, stderr });

      }
      else {

        const isCanceled = code !== null && cancelCodes.includes(code);

        reject(
          isCanceled
            ? new OperationCanceledError()
            : new ShellError(
                `Failed to execute command ${command} ${args.join(' ')}: ${stderr}`
              )
        );

      }

    });

  });

}

/**
 * Универсальная функция для запуска команд.
 *
 * @since 0.4.0
 *
 **/
export const runCommandAsync = async (
  command: string,
  args?: string[],
  options: RunOptions = {}
) => await execAsync(command, args, { ...options });
