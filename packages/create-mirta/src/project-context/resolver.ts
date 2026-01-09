import { t } from '#i18n'
import type { ProjectSelection } from '#project/types'
import { resolveTemplateSequenceAsync } from '#template/index'
import { logger } from '#utils/logger'
import { resolve, sep } from 'node:path'
import { confirmOverwriteAsync } from './overwrite.confirm'
import { promptProjectFolderAsync } from './project-folder.prompt'
import type { ProjectContext } from './types'
import { CreationError, OperationCanceledError } from '#errors'
import { isDirEmptyAsync, isExistsAsync } from '#utils/file-system'

export interface ResolutionOptions {

  cwd?: string

  projectFolder?: string

  forceOverwrite?: boolean

  barebone?: boolean

}

export async function resolveProjectContextAsync(

  selection: ProjectSelection,
  options: ResolutionOptions = {}

): Promise<ProjectContext> {

  const {

    cwd = process.cwd(),
    barebone,

  } = options

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const projectName = options.projectFolder || await promptProjectFolderAsync(`wb-mirta-${selection.type}`)

  if (options.projectFolder)
    logger.step(`${t('projectFolder.prompt')}: ${options.projectFolder}`)

  const projectRoot = resolve(cwd, projectName)

  if (!projectRoot.startsWith(cwd.endsWith('/') ? cwd : cwd + sep) && projectRoot !== cwd)
    throw CreationError.get('project.outsideRoot')

  const isExists = await isExistsAsync(projectRoot)
  const isEmpty = !isExists || await isDirEmptyAsync(projectRoot)

  let shouldOverwrite = false

  if (!isEmpty) {

    shouldOverwrite
      = options.forceOverwrite === true || await confirmOverwriteAsync(projectRoot)

    if (!shouldOverwrite)
      throw new OperationCanceledError()

  }

  const templates = await resolveTemplateSequenceAsync(selection)

  return {

    rootDir: projectRoot,
    name: projectName,

    shouldOverwrite: shouldOverwrite,
    shouldCreate: !isExists,

    templates: templates,
    barebone: barebone,

  }

}
