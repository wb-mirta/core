export function translit(input: string): string {

  const map: Record<string, string> = {
    'А': 'A',
    'Б': 'B',
    'В': 'V',
    'Г': 'G',
    'Д': 'D',
    'Е': 'E',
    'Ё': 'YO',
    'Ж': 'ZH',
    'З': 'Z',
    'И': 'I',
    'Й': 'I',
    'К': 'K',
    'Л': 'L',
    'М': 'M',
    'Н': 'N',
    'О': 'O',
    'П': 'P',
    'Р': 'R',
    'С': 'S',
    'Т': 'T',
    'У': 'U',
    'Ф': 'F',
    'Х': 'H',
    'Ц': 'CZ',
    'Ч': 'CH',
    'Ш': 'SH',
    'Щ': 'SCH',
    'Ъ': '\'',
    'Ы': 'I',
    'Ь': '\'',
    'Э': 'E',
    'Ю': 'YU',
    'Я': 'YA',
  };

  let result = '';

  for (const char of input) {

    result += map[char] ?? char;

  }

  // Постобработка: CZI → CI, CZE → CE и т.д.
  return result
    .replace(/CZI/g, 'CI')
    .replace(/CZE/g, 'CE')
    .replace(/CZY/g, 'CY')
    .replace(/CZJ/g, 'CJ');

}
