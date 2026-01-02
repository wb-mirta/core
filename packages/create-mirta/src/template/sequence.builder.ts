import type { Template, TemplateSequence } from './types'

export function buildSequence(
  target: Template,
  templates: ReadonlyMap<string, Template>
): TemplateSequence {

  const stack: Template[] = [target]

  // Иерархическая последовательность шаблонов.
  const sequence: Template[] = []

  // Для предотвращения зацикливания.
  const seen = new Set<string>()

  while (stack.length > 0) {

    // Извлекаем последний шаблон из стека.
    const template = stack.pop()

    // Если ничего не осталось, обработка завершена.
    if (!template)
      break

    if (seen.has(template.name))
      throw new Error('Cyclic template inheritance')

    seen.add(template.name)

    if (template.extends) {

      const parent = templates.get(template.extends)

      if (!parent)
        throw new Error(`Unknown parent template ${template.extends} in ${template.name}`)

      stack.push(parent)

    }

    sequence.push(template)

  }

  // Инвертированная последовательность начинается с корня.
  return sequence.reverse()

}
