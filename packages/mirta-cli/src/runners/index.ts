import type { StagedArgs } from '#src/utils/staged-args'
import { suggestClosest } from '@mirta/basics/fuzzy'
import { t } from '../i18n'

type AsyncRunner = (args: StagedArgs) => Promise<void>

const runners: Record<string, () => Promise<AsyncRunner>> = {

  release: async () => (await import('./release')).runAsync,
  publish: async () => (await import('./publish')).runAsync,

}

export async function resolveRunnerAsync(nameInput: string) {

  const runner = runners[nameInput]

  if (!(nameInput in runners)) {

    const knownNames = Object.keys(runners)

    const suggestion = nameInput.length > 1
      ? suggestClosest(nameInput, knownNames, { ignoreCase: true })
      : undefined

    const errorInput = suggestion
      ? t('command.suggest', { input: nameInput, suggestion })
      : nameInput

    throw new Error(t('command.notFound', { input: errorInput }))

  }

  return {
    runAsync: await runner(),
  }

}
