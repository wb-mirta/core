import { spawn } from 'node:child_process'

interface RunCommandOptions {
  root: string
  detach?: boolean
  onClose?: (code: number | null) => void
}

export function runCommand(command: string, args: string[], options: RunCommandOptions) {

  return new Promise<void>((resolve, reject) => {

    const runner = spawn(
      command,
      args,
      {
        cwd: options.root,
        stdio: 'inherit',
        shell: true,
        ...options,
      }
    )

    runner.on('exit', (code) => {

      console.log()

      if (code) {

        console.log(` ${command} FAILED...`)
        console.log()

        reject(new Error())

      }
      else {

        resolve()

      }

    })

  })

}
