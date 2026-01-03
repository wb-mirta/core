import type { JsonObject } from '#types'
import { isObject } from '@mirta/basics'

export default function sortDependencies(
  packageJson: JsonObject
): JsonObject {

  const sorted = {}

  const depTypes = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]

  depTypes.forEach((depType) => {

    if (isObject(packageJson[depType])) {

      const sourceDeps = packageJson[depType]
      const sortedDeps = sorted[depType] = {} as object

      Object.keys(packageJson[depType])
        .sort()
        .forEach((name) => {

          sortedDeps[name] = sourceDeps[name] as unknown

        })

    }

  })

  return {
    ...packageJson,
    ...sorted,
  }

}
