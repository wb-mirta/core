import { createScanner, SyntaxKind } from 'jsonc-parser';
import { JsoncContainer, JsoncNode } from './types';

function getReadable(token: SyntaxKind): string {

  switch (token) {

    case SyntaxKind.StringLiteral:
      return 'string';

    case SyntaxKind.NumericLiteral:
      return 'number';

    case SyntaxKind.TrueKeyword:
      return 'true';

    case SyntaxKind.FalseKeyword:
      return 'false';

    case SyntaxKind.NullKeyword:
      return 'null';

    case SyntaxKind.CloseBraceToken:
      return '}';

    case SyntaxKind.CloseBracketToken:
      return ']';

    case SyntaxKind.CommaToken:
      return ',';

    case SyntaxKind.ColonToken:
      return ':';

    default:
      return 'unknown';
  }

}

export function parseJsonc(text: string): JsoncContainer {

  const scanner = createScanner(text);
  const comments: string[] = [];
  let token = scanner.scan();

  // === Вспомогательные функции ===

  const advance = () => (token = scanner.scan());

  const skipTrivia = () => {

    while (
      token === SyntaxKind.LineCommentTrivia
      || token === SyntaxKind.BlockCommentTrivia
      || token === SyntaxKind.LineBreakTrivia
      || token === SyntaxKind.Trivia
    ) {

      if (
        token === SyntaxKind.LineCommentTrivia
        || token === SyntaxKind.BlockCommentTrivia
      ) {

        comments.push(scanner.getTokenValue().trim());

      }
      advance();

    }

  };

  // Сканим и пропускаем тривиалы
  const next = () => {

    advance();
    skipTrivia();

    return token;

  };

  const takeComments = (): string[] | undefined => {

    if (comments.length === 0)
      return undefined;
    const result = [...comments];
    comments.length = 0;
    return result;

  };

  const nodeWithComments = (node: JsoncNode = {}): JsoncNode => {

    const commentsBefore = takeComments();

    if (commentsBefore)
      node.comments = commentsBefore;

    return node;

  };

  const consume = (
    expected: SyntaxKind,
    isOptional?: boolean
  ) => {

    if (token === expected)
      return next();

    if (!isOptional)
      throw new Error(`Expected ${getReadable(expected)}, got ${scanner.getTokenValue()} at position ${scanner.getPosition()}`);

  };

  // === Основные парсеры ===

  const parseValue = (): JsoncNode => {

    const node = nodeWithComments({});

    switch (token) {
      case SyntaxKind.StringLiteral:
        node.value = scanner.getTokenValue();
        next();
        break;

      case SyntaxKind.NumericLiteral:
        node.value = Number(scanner.getTokenValue());
        next();
        break;

      case SyntaxKind.TrueKeyword:
        node.value = true;
        next();
        break;

      case SyntaxKind.FalseKeyword:
        node.value = false;
        next();
        break;

      case SyntaxKind.NullKeyword:
        node.value = null;
        next();
        break;

      case SyntaxKind.OpenBraceToken:
        node.value = parseObject();
        break;

      case SyntaxKind.OpenBracketToken:
        node.value = parseArray();
        break;

      default:
        throw new Error(`Unexpected ${getReadable(token)} at position ${scanner.getPosition()}`);
    }

    return node;

  };

  const parseObject = (): JsoncContainer => {

    next(); // skip '{'
    const result: JsoncContainer = {};

    while (token !== SyntaxKind.CloseBraceToken && token !== SyntaxKind.EOF) {

      // Проверяем, что текущий токен — строка
      if (token !== SyntaxKind.StringLiteral)
        throw new Error(`Expected key at position ${scanner.getPosition()}`);

      // Сохраняем значение ДО продвижения
      const key = scanner.getTokenValue();

      next();
      consume(SyntaxKind.ColonToken);

      result[key] = parseValue();

      consume(SyntaxKind.CommaToken, true);

    }

    consume(SyntaxKind.CloseBraceToken);

    return result;

  };

  const parseArray = (): JsoncNode[] => {

    next(); // skip '['
    const result: JsoncNode[] = [];

    while (token !== SyntaxKind.CloseBracketToken && token !== SyntaxKind.EOF) {

      result.push(parseValue());

      if (token === SyntaxKind.CommaToken) {

        next();

      }

    }

    consume(SyntaxKind.CloseBracketToken);

    return result;

  };

  // === Запуск ===
  skipTrivia();

  if (token === SyntaxKind.OpenBraceToken) {

    comments.length = 0; // сброс комментариев до корневого объекта
    return parseObject();

  }

  throw new Error('Root must be object');

}
