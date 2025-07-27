import { spawn } from 'node:child_process'
import { useLogger } from './logger.js'

const logger = useLogger()

export function ShellError(/** @type {string} */ message) {

  Error.call(this, message)

  this.name = 'ShellError'
  this.message = message

  if (Error.captureStackTrace) {

    Error.captureStackTrace(this, ShellError)

  }
  else {

    this.stack = (new Error()).stack

  }

}

ShellError.prototype = new Error()

/**
 * @typedef ExecutionResult
 * @property {boolean} isDone
 * @property {number} code
 * @property {string} stderr
 * @property {string} stdout
 */

/**
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import('node:child_process').SpawnOptionsWithoutStdio} options
 *
 * @returns {Promise<ExecutionResult>}
 */
async function execAsync(command, args, options) {

  return new Promise((resolve, reject) => {

    const runner = spawn(command, args, {
      stdio: [
        'ignore', // stdin
        'pipe', // stdout
        'pipe', // stderr
      ],
      ...options,
      shell: process.platform === 'win32',
    })

    /** @type {Buffer[]} */
    const stdoutChunks = []

    /** @type {Buffer[]} */
    const stderrChunks = []

    runner.stdout?.on('data', (chunk) => {

      stdoutChunks.push(chunk)

    })

    runner.stderr?.on('data', (chunk) => {

      stderrChunks.push(chunk)

    })

    runner.on('error', (error) => {

      reject(error)

    })

    runner.on('exit', (code) => {

      const isDone = code === 0

      const stdout = Buffer.concat(stdoutChunks).toString().trim()
      const stderr = Buffer.concat(stderrChunks).toString().trim()

      if (isDone) {

        resolve({ isDone, code, stdout, stderr })

      }
      else {

        reject(
          new ShellError(
            `Failed to execute command ${command} ${args.join(' ')}: ${stderr}`
          )
        )

      }

    })

  })

}

const runCommandAsync = async (
  /** @type {string} */ command,
  /** @type {readonly string[]} */ args,
  /** @type {import('node:child_process').SpawnOptions} */ options = {}
) => execAsync(command, args, { ...options })

const dryRunCommandAsync = async (
  /** @type {string} */ command,
  /** @type {readonly string[]} */ args
) => logger.info(`${command} ${args.join(' ')}`, 'Dry')

runCommandAsync.ifNotDry = isDryRun =>
  isDryRun ? dryRunCommandAsync : runCommandAsync

export {
  runCommandAsync
}
