import { spawn, type SpawnOptions } from 'node:child_process'
import { useLogger } from '#utils/logger'
import type { WslDistroName } from '#src/config/types'

const logger = useLogger()

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

export class OperationCanceledError extends Error {
  constructor() {

    super()

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, OperationCanceledError.prototype)

    this.name = 'OperationCanceledError'

    Error.captureStackTrace(this, OperationCanceledError)

  }
}

interface ExecutionResult {
  isDone: boolean
  code: number
  stderr: string
  stdout: string
}

interface RunOptions extends SpawnOptions {

  doneCodes?: number[]
  cancelCodes?: number[]

}

export async function execAsync(
  command: string,
  args: string[] = [],
  options: RunOptions = {}
): Promise<ExecutionResult> {

  return new Promise((resolve, reject) => {

    const { doneCodes = [0], cancelCodes = [130], ...spawnOptions } = options

    spawnOptions.stdio ??= [
      'ignore',
      'pipe',
      'pipe',
    ]

    spawnOptions.shell ??= false

    const runner = spawn(command, args, spawnOptions)

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    runner.stdout?.on('data', (chunk: Buffer) => {

      stdoutChunks.push(chunk)

    })

    runner.stderr?.on('data', (chunk: Buffer) => {

      stderrChunks.push(chunk)

    })

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

export type RunAsync = (command: string, args?: string[], options?: RunOptions) => Promise<ExecutionResult>

interface RunCommandAsync {

  (
    command: string,
    args?: string[],
    options?: RunOptions
  ): Promise<ExecutionResult>

  inUnixShell: (wsl?: WslDistroName) => RunAsync

  dry: (isDryRun: boolean) => RunAsync

}

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
