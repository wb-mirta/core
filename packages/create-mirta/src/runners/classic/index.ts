import fs from 'node:fs/promises'
import chalk from 'chalk'
import type { StagedArgs } from '@mirta/staged-args'
import { parseArgs } from './args'
import { logger } from '#utils/logger'
import { t } from '#i18n'
import { clearDirAsync, isExistsAsync } from '#utils/file-system'
import { renderDirectoryAsync, toTemplateData } from '#render/render-directory'
import type { ProjectContext } from '#project-context/types'
import { resolveFeaturesAsync } from '#feature/resolver'
import { resolveConnectionStringAsync } from '#connection/resolver'
import { promptInstallDependenciesAsync } from '#dependency/installer'

export async function runAsync(
  args: StagedArgs,
  context: ProjectContext
) {

  const { values: argv } = parseArgs(args)

  const { rootDir } = context

  // Дополнительный функционал, который будет задействован.
  const features = await resolveFeaturesAsync(context, {
    eslint: argv.eslint,
    vitest: argv.vitest,
    connection: argv.ssh,
  })

  const data = toTemplateData({
    name: context.name,
    features: features,
    barebone: context.barebone,
  })

  // Если добавлено подключение к контроллеру, выполняем настройку.
  if (features.includes('connection')) {

    data.connectionString
      = await resolveConnectionStringAsync(
        argv.ssh,
        argv.rutoken
      )

  }

  // Удаляем содержимое, если директория существует и получено подтверждение.
  if (context.shouldOverwrite) {

    logger.step(chalk.red(t('step.removingFiles')))

    await clearDirAsync(rootDir)

  }
  // Создаём директорию при её отсутствии.
  else if (context.shouldCreate) {

    await fs.mkdir(rootDir, { recursive: true })

  }

  logger.step(t('step.scaffolding', {
    folder: chalk.yellow(rootDir),
  }))

  const knownCompounds = new Map<string, boolean>()

  for (const template of context.templates) {

    await renderDirectoryAsync(
      `${template.rootDir}/content`,
      rootDir,
      data
    )

    for (const feature of features) {

      const featurePath = `${template.rootDir}/features/${feature}`

      if (!await isExistsAsync(featurePath))
        continue

      await renderDirectoryAsync(featurePath, rootDir, data)

    }

    const compoundFeatures = template.features?.compound

    if (!compoundFeatures)
      continue

    for (const feature of compoundFeatures) {

      let isApplicable = knownCompounds.get(feature)

      if (isApplicable === undefined) {

        isApplicable = feature
          .split('-')
          .every(x => features.includes(x))

        knownCompounds.set(feature, isApplicable)

      }

      if (!isApplicable)
        continue

      const featurePath = `${template.rootDir}/features/${feature}`

      if (!await isExistsAsync(featurePath))
        continue

      await renderDirectoryAsync(featurePath, rootDir, data)

    }

  }

  await promptInstallDependenciesAsync(rootDir)

}
