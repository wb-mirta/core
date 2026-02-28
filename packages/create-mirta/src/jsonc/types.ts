/**
 * Контейнер JSONC — объект с ключами и узлами.
 *
 * @since 0.4.0
 *
 **/
export type JsoncContainer = Record<string, JsoncNode>;

/**
 * Узел JSONC — содержит значение и опциональные комментарии.
 *
 * @since 0.4.0
 *
 **/
export interface JsoncNode {

  /** Комментарии, предшествующие узлу. */
  comments?: string[];

  /** Значение узла: примитив, контейнер или массив узлов. */
  value?: string | number | boolean | null | JsoncContainer | JsoncNode[];

}
