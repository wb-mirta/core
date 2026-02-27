import { spawn } from 'node:child_process';

/**
 * Запускает команду в дочернем процессе с поддержкой таймаута, отмены и обработки ошибок.
 *
 * @param {string} command - Имя команды (например, 'git', 'npm').
 * @param {string[]} args - Аргументы команды.
 * @param {Object} [options] - Опции выполнения.
 * @param {string} [options.cwd] - Рабочая директория.
 * @param {Object} [options.env] - Переменные окружения. По умолчанию — process.env.
 * @param {number} [options.timeout] - Таймаут в миллисекундах.
 * @param {AbortSignal} [options.signal] - Сигнал для отмены выполнения.
 * @param {'inherit'|'pipe'|'ignore'} [options.stdio='pipe'] - Поведение потоков ввода/вывода.
 * @param {boolean} [options.shell=false] - Запускать ли команду через оболочку.
 * @returns {{ child: import('child_process').ChildProcess, result: Promise<void> }}
 *          Объект с процессом и промисом результата.
 *
 * @example
 * ```ts
 * const { result } = runCommand('ls', ['-l'], { cwd: '/project' });
 * await result; // выбросит ошибку при ненулевом коде возврата
 *
 * ```
 * @since 0.4.0
 *
 **/
export function runCommand(command, args, options = {}) {

  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: options.stdio ?? 'pipe',
    shell: options.shell ?? false,
  });

  const result = new Promise((resolve, reject) => {

    let timeoutId;
    let abortHandler;

    const cleanup = () => {

      if (timeoutId != null) {

        clearTimeout(timeoutId);
        timeoutId = undefined;

      }

      if (!abortHandler || !options.signal)
        return;

      options.signal.removeEventListener('abort', abortHandler);
      abortHandler = undefined;

    };

    // Обработка сигнала отмены
    if (options.signal) {

      // Проверка немедленной отмены
      if (options.signal.aborted) {

        cleanup();
        child.kill('SIGTERM');

        reject(new Error('Operation aborted'));
        return;

      }

      abortHandler = () => {

        cleanup();

        child.kill('SIGTERM');
        reject(new Error('Operation aborted'));

      };

      options.signal.addEventListener('abort', abortHandler, { once: true });

    }

    // Установка таймаута
    if (options.timeout) {

      timeoutId = setTimeout(() => {

        cleanup();
        child.kill('SIGTERM');
        reject(new Error(`Process timed out after ${options.timeout}ms`));

      }, options.timeout);

    }

    // Ошибка запуска процесса
    child.on('error', (err) => {

      cleanup();
      reject(err);

    });

    // Завершение процесса
    child.on('close', (code, signal) => {

      cleanup();

      if (code === 0) {

        resolve();

      }
      else {

        const reason = code != null ? `code ${code}` : `signal ${signal}`;
        reject(new Error(`Process "${command}" failed with ${reason}`));

      }

    });

  });

  return { child, result };

}
