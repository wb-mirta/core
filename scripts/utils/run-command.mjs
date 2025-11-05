import { spawn } from 'node:child_process'

/**
 * Запускает указанную команду в дочернем процессе и возвращает объект с ссылкой на процесс и промисом результата.
 *
 * Поддерживает:
 * - таймаут выполнения,
 * - отмену через AbortSignal,
 * - обработку ошибок.
 *
 * @param {string} command - Имя команды (например, 'npm', 'git').
 * @param {string[]} args - Аргументы команды.
 * @param {Object} options - Опции выполнения.
 * @param {string} [options.cwd] - Рабочая директория.
 * @param {Object} [options.env] - Переменные окружения.
 * @param {number} [options.timeout] - Таймаут в миллисекундах.
 * @param {AbortSignal} [options.signal] - Сигнал отмены.
 * @param {'inherit'|'pipe'|'ignore'} [options.stdio='pipe'] - Потоки ввода/вывода.
 * @param {boolean} [options.shell=false] - Запуск через оболочку.
 * @returns {{ child: import('child_process').ChildProcess, result: Promise<void> }}
 */
export function runCommand(command, args, options = {}) {

  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: options.stdio ?? 'pipe',
    shell: options.shell ?? false,
  })

  const result = new Promise((resolve, reject) => {

    let timeoutId

    // Обработка сигнала отмены
    if (options.signal) {

      if (options.signal.aborted) {

        child.kill('SIGTERM')
        reject(new Error('Operation aborted'))
        return

      }

      options.signal.addEventListener('abort', () => {

        child.kill('SIGTERM')
        reject(new Error('Operation aborted'))

      })

    }

    // Таймаут
    if (options.timeout) {

      timeoutId = setTimeout(() => {

        child.kill('SIGTERM')
        reject(new Error(`Process timed out after ${options.timeout}ms`))

      }, options.timeout)

    }

    // Ошибки запуска
    child.on('error', (err) => {

      clearTimeout(timeoutId)
      reject(err)

    })

    // Завершение процесса
    child.on('close', (code, signal) => {

      clearTimeout(timeoutId)
      if (code === 0) {

        resolve()

      }
      else {

        const reason = code != null ? `code ${code}` : `signal ${signal}`
        reject(new Error(`Process "${command}" failed with ${reason}`))

      }

    })

  })

  return { child, result }

}
