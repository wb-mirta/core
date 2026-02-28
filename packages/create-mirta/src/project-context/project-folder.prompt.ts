import { t } from '#i18n';
import { prompts } from '#utils/prompts';

export async function promptProjectFolderAsync(
  defaultValue: string
): Promise<string> {

  const { projectFolder } = await prompts({
    type: 'text',
    name: 'projectFolder',
    message: t('projectFolder.prompt'),
    initial: defaultValue,
    validate: (value: string) => {

      return value.trim().length === 0
        ? t('validation.required')
        : true;

    },
  }) as { projectFolder: string };

  return projectFolder.trim();

}
