import type { FeatureState } from '#feature/types'
import type { ProjectType } from '#project/types'

export type TemplateName = Branded<string, 'TemplateName'>

/**
 * Интерфейс шаблона — описывает метаданные и поведение шаблона
 *
 * @since 0.4.0
 *
 **/
export interface Template {

  /**
   * Наследование от другого шаблона (например, 'base')
   * Позволяет расширять функциональность.
   *
   **/
  extends?: string

  /**
   * Скрывает шаблон в пользовательском интерфейсе.
   *
   **/
  hidden?: boolean

  /**
   * Тип проекта — определяет, к какой категории относится шаблон
   *
   **/
  type: ProjectType

  /**
   * Внутреннее имя шаблона (например, 'base' или 'store')
   * Используется для идентификации и поиска
   *
   **/
  name: TemplateName

  /**
   * Отображаемое имя (например, 'Base Project')
   * Используется в интерфейсе (например, при выборе)
   *
   **/
  displayName: string

  /**
   * Краткое описание шаблона
   * Показывается в подсказках при выборе
   *
   **/
  description: string

  /**
   * Список фич
   *
   **/
  features?: {

    global: Readonly<Record<string, FeatureState>>

    compound: readonly string[]

  }

  /**
   * Корневая папка шаблона
   *
   **/
  rootDir: string

  /**
   * Порядок шаблонов при выборе
   *
   **/
  order: number

}

export type RawTemplate = Partial<Omit<Template, 'rootDir'>>

export type TemplateSequence = readonly Template[]
