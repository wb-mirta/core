import { JsoncContainer, JsoncNode } from './types';

function serializeNode(value: unknown, indentSize = 0): string {

  const indent = '  '.repeat(indentSize);
  const nextIndent = '  '.repeat(indentSize + 1);

  if (value === null)
    return 'null';

  if (typeof value === 'object') {

    if (Array.isArray(value)) {

      if (value.length === 0)
        return '[]';

      const items = value.map((item: JsoncNode) => {

        const comments = item.comments ?? [];

        const serializedValue = serializeNode(item.value, indentSize + 1);
        const commentLines = comments.map(c => `${nextIndent}${c}`).join('\n');

        return commentLines
          ? `${commentLines}\n${nextIndent}${serializedValue}`
          : `${nextIndent}${serializedValue}`;

      });

      return `[\n${items.join(`,\n`)}\n${indent}]`;

    }

    // Это JsoncContainer
    const container = value as JsoncContainer;

    const keys = Object.keys(container);

    if (keys.length === 0)
      return '{}';

    const entries = keys.map((key) => {

      const node = container[key];

      const comments = node.comments?.map(c => `${nextIndent}${c}`).join('\n');

      const serializedValue = serializeNode(node.value, indentSize + 1);

      const field = `${nextIndent}${JSON.stringify(key)}: ${serializedValue}`;

      return [comments, field].filter(Boolean).join('\n');

    });

    return `{\n${entries.join(',\n')}\n${indent}}`;

  }

  // Простые значения
  return JSON.stringify(value);

}

export function stringify(container: JsoncContainer): string {

  return serializeNode(container, 0);

}
