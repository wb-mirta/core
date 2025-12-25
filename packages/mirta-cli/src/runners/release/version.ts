import { prompts } from '#src/utils/prompts'
import { inc, valid, type ReleaseType } from 'semver'
import { logger } from '#utils/logger'

function getReleaseTypes(preid: string | undefined): readonly ReleaseType[] {

  const releaseTypes: readonly ReleaseType[] = [
    'patch',
    'minor',
    'major',
    ...(preid
      ? (['prepatch', 'preminor', 'premajor', 'prerelease']) as const
      : [] as const
    ),
  ] as const

  return releaseTypes

}

export async function determineTargetVersion(
  currentVersion: string,
  preid: string | undefined,
  skipPrompts: boolean,
  preferredVersion?: string
): Promise<string> {

  let targetVersion = preferredVersion

  const releaseTypes = getReleaseTypes(preid)

  if (!targetVersion) {

    if (skipPrompts) {

      logger.info('Skipping prompts. Default to "patch" release.')

      targetVersion = inc(currentVersion, 'patch', undefined, preid) ?? ''

      if (!targetVersion)
        throw new Error(`Failed to compute target version from ${currentVersion}`)

      if (!valid(targetVersion))
        throw new Error(`Invalid target version: ${targetVersion}`)

      return targetVersion

    }

    const choices = releaseTypes
      .map((releaseType) => {

        const version = inc(currentVersion, releaseType, undefined, preid)

        return {
          title: `${releaseType} (${version})`,
          value: version,
        }

      })
      .filter(choice => choice.value !== null)
      .concat({
        title: 'custom',
        value: 'custom',
      })

    const { release } = await prompts({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices,
    })

    if (release === 'custom') {

      const { version } = await prompts({
        type: 'text',
        name: 'version',
        message: 'Type custom version',
        initial: currentVersion,
      })

      targetVersion = version as string

    }
    else {

      targetVersion = release as string

    }

  }

  // Если вместо номера версии передан тип релиза — инкрементируем
  //
  if (releaseTypes.includes(targetVersion as ReleaseType))
    targetVersion = inc(currentVersion, targetVersion as ReleaseType, undefined, preid) ?? ''

  if (!targetVersion)
    throw new Error(`Failed to compute target version from ${currentVersion}`)

  if (!valid(targetVersion))
    throw new Error(`Invalid target version: ${targetVersion}`)

  return targetVersion

}
