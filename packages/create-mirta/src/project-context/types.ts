import type { TemplateSequence } from '#template/types';

export interface ProjectContext {

  name: string;
  rootDir: string;

  shouldOverwrite: boolean;
  shouldCreate: boolean;

  templates: TemplateSequence;

  barebone: boolean | undefined;

}
