export type JsoncContainer = Record<string, JsoncNode>

export interface JsoncNode {

  comments?: string[]
  value?: string | number | boolean | null | JsoncContainer | JsoncNode[]

}
