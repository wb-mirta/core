import { codes } from './codes';
import { translit } from '#src/fuzzy/translit';
import type { DaitchMokotoffNode, DaitchMokotoffRule, PhoneticCode } from './types';

type PreparedWord = Branded<string, 'PreparedWord'>;

/**
 * Подготавливает строку: очищает, приводит к верхнему регистру,
 * транслитерирует кириллицу и удаляет не-буквенные символы.
 *
 * @since 0.4.0
 *
 **/
function prepareInput(
  input: string | null | undefined
): { word: PreparedWord | undefined; isCyrillic: boolean } {

  if (!input)
    return { word: undefined, isCyrillic: false };

  let word = input
    .trim()
    .toUpperCase();

  const isCyrillic = /[А-ЯЁ]/.test(word);

  // Транслитерация кириллицы
  if (isCyrillic)
    word = translit(word);

  // Удаляем всё, кроме букв
  word = word.replace(/[^A-Z]/g, '');

  return {
    word: word as PreparedWord,
    isCyrillic,
  };

}

/**
 * Возвращает правило кодирования: [0] — для латиницы, [1] — для кириллицы.
 *
 * @since 0.4.0
 *
 **/
function getRule(node: DaitchMokotoffNode, isCyrillic: boolean): DaitchMokotoffRule {

  if (isCyrillic && '1' in node)
    return node[1] as DaitchMokotoffRule;

  return node[0] as DaitchMokotoffRule;

}

/**
 * Выбирает код из правила [начало, перед_гласной, иначе]:
 * - Если в начале слова — [0]
 * - Если следующий символ — гласная (A,E,I,O,U) — [1]
 * - Иначе — [2]
 *
 * @since 0.4.0
 *
 **/
function selectCode(codeSet: DaitchMokotoffRule, word: PreparedWord, position: number, offset: number): number {

  if (position === 0)
    return codeSet[0];

  const nextChar = word[position + offset];

  if (nextChar && 'AEIOU'.includes(nextChar))
    return codeSet[1];

  return codeSet[2];

}

function padRight(str: string, length: number, char: string): string {

  while (str.length < length)
    str += char;

  return str.slice(0, length);

}

/**
 * Упрощённая реализация алгоритма Daitch-Mokotoff для фонетического кодирования.
 *
 * Сложность: `O(n)` — один проход по строке.
 *
 * Преобразует строки в 6-значные коды, устойчивые к опечаткам, транслитерации и диалектным различиям.
 * Поддерживает кириллицу через транслитерацию.
 *
 * @param input - Входная строка (может быть `null` / `undefined`)
 * @returns 6-значный фонетический код
 *
 * @since 0.4.0
 *
 **/
export function daitchMokotoffLite(input: string | null | undefined): PhoneticCode {

  const { word, isCyrillic } = prepareInput(input);

  if (!word)
    return '000000' as PhoneticCode;

  let i = 0;
  let prev = -1; // Предыдущий добавленный код (для избежания дублей)

  let lastNode: DaitchMokotoffNode | undefined;
  let currentNode: DaitchMokotoffNode | undefined;

  let result = '';

  // Основной цикл: обработка по символам с учётом контекстных правил
  while (i < word.length) {

    // Начинаем с узла, соответствующего текущему символу
    currentNode = lastNode = codes[word[i]] as DaitchMokotoffNode;

    let j = 1; // длина текущего совпавшего токена

    // Поиск самого длинного совпадения (до 6 символов вперёд)
    for (let k = 1; k < 7; k++) {

      const char = word[i + k];

      if (!char || !currentNode[char])
        break;

      currentNode = currentNode[char] as DaitchMokotoffNode;

      // Если текущий узел содержит правило (массив кодов) — фиксируем
      if (currentNode[0]) {

        lastNode = currentNode;
        j = k + 1; // обновляем длину

      }

    }

    // Выбираем код в зависимости от позиции и следующего символа
    const code = selectCode(
      // Выбираем правило: [0] — латиница, [1] — кириллица
      getRule(lastNode, isCyrillic),
      word,
      i,
      j
    );

    // console.log({
    //   word,
    //   char: word[i],
    //   rule: getRule(lastNode, isCyrillic),
    //   code,
    //   j,
    //   nextChar: word[i + j],
    // })

    // Добавляем код, только если он не -1 и не дублирует предыдущий
    if (code !== -1 && code !== prev)
      result += String(code);

    prev = code;
    i += j; // пропускаем обработанные символы

  }

  // Дополняем результат нулями до 6 символов
  return padRight(result, 6, '0') as PhoneticCode;

}
