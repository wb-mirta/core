/**
 * Сравнивает путь с шаблоном и возвращает относительную часть.
 * Используется для корректного определения путей в монорепозитории.
 *
 * @param path - полный путь к файлу
 * @param pattern - шаблон для сравнения (например, workspace-паттерн)
 * @returns Относительная часть пути или undefined при несоответствии
 *
 * @since 0.3.0
 *
 **/
export function globRelative(path: string, pattern: string) {

  const pathParts = path.split('/')
  const patternParts = pattern.split('/')

  let i = 0 // Индекс текущего компонента пути.

  for (let j = 0; j < patternParts.length && i < pathParts.length; j++) {

    switch (patternParts[j]) {
      case '*':
        break
      case '**':
        while (i < pathParts.length && !pathParts[i].startsWith(patternParts[j + 1])) {

          i += 1 // Пропускаем все элементы пути до следующего элемента шаблона.

        }
        break
      default:
        if (patternParts[j] === pathParts[i]) {

          i += 1

        }
        else {

          return void 0 // Несоответствие фиксированного значения.

        }
    }

  }

  return pathParts.slice(i).join('/')

}
