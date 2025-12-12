import { spawn, type SpawnOptionsWithoutStdio } from 'node:child_process'
import { useLogger } from '#utils/logger'

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

interface ExecutionResult {
  isDone: boolean
  code: number
  stderr: string
  stdout: string
}

async function execAsync(
  command: string,
  args?: readonly string[],
  options?: SpawnOptionsWithoutStdio
): Promise<ExecutionResult> {

  args ??= []

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

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    runner.stdout?.on('data', (chunk: Buffer) => {

      stdoutChunks.push(chunk)

    })

    runner.stderr?.on('data', (chunk: Buffer) => {

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
  command: string,
  args?: readonly string[],
  options: SpawnOptionsWithoutStdio = {}
) => await execAsync(command, args, { ...options })

const dryRunCommandAsync = (
  command: string,
  args?: readonly string[]
) => {

  logger.info(`${command} ${args?.join(' ')}`, 'Dry')

}

runCommandAsync.ifNotDry = (isDryRun?: boolean) =>
  isDryRun ? dryRunCommandAsync : runCommandAsync

export {
  runCommandAsync
}
