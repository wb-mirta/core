import type { ProjectContext } from '#project-context/types';
import type { ProjectType } from '#project/types';
import type { StagedArgs } from '@mirta/staged-args';

interface AsyncRunner {

  runAsync: (
    args: StagedArgs,
    context: ProjectContext
  ) => Promise<void>;

}

async function loadAsync(
  type: ProjectType
): Promise<AsyncRunner> {

  switch (type) {

    case 'classic':
      return await import('./classic');

    case 'mono':
      return await import('./mono');

    default:
      throw new Error(
        `Unknown project type: ${type as string}`
      );

  }

}

export async function resolveRunnerAsync(projectType: ProjectType) {

  return await loadAsync(projectType);

}
