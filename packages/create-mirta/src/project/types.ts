/**
 * Тип проекта: 'classic' — привычный формат, 'mono' — монорепозиторий
 *
 * @since 0.4.0
 *
 **/
export type ProjectType = 'classic' | 'mono'

export interface ProjectSelection {

  type: ProjectType

  templateName?: string

}
