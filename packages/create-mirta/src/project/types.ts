/**
 * Тип проекта: 'classic' — привычный формат, 'modular' — модульная структура
 *
 * @since 0.4.0
 *
 **/
export type ProjectType = 'classic' | 'modular'

export interface ProjectSelection {

  type: ProjectType

  templateName?: string

}
