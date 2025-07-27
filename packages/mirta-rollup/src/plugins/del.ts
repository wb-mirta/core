import { deleteAsync, type Options as DelOptions } from 'del'
import type { AsyncPluginHooks, Plugin } from 'rollup'

export interface Options extends DelOptions {

  /**
   * Rollup hook the plugin should use.
   * @default 'buildStart'
  */
  readonly hook?: AsyncPluginHooks

  /**
   * Delete items once. Useful in watch mode.
   */
  readonly runOnce?: boolean

  /**
   * Patterns of files and folders to be deleted.
   *
   * ```js
   * // Folder
   * del({ targets: 'build' })
   * // File
   * del({ targets: 'dist/app.js' })
   * // Multiple files
   * del({ targets: 'build/*.js' })
   * // Mixed
   * del({ targets: ['dist/*', 'images/*.webp'] })
   * ```
   *
   * @default []
   */
  readonly targets?: readonly string[] | string

  /**
   * Outputs removed files and folders to console.
   * @default false
   */
  readonly verbose?: boolean
}

export default function del(options: Options = {}): Plugin {

  const {
    hook = 'buildStart',
    runOnce = false,
    targets = [],
    verbose = false,
  } = options

  let isDeleted = false

  return {
    name: 'del',
    [hook]: async () => {

      if (runOnce && isDeleted)
        return

      const paths = await deleteAsync(targets, options)

      if (verbose || options.dryRun) {

        const message = options.dryRun
          ? `Expected files and folders to be deleted: ${paths.length.toString()}`
          : `Deleted files and folders: ${paths.length.toString()}`

        console.log(message)

        if (paths.length)
          paths.forEach((path) => {

            console.log(path)

          })

      }

      isDeleted = true

    },
  }

}
