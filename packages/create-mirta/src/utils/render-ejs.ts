import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ejs from 'ejs'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default function renderEjs(filePath: string, data: ejs.Data) {

  const fullPath = resolve(__dirname, filePath)

  const template = readFileSync(fullPath, 'utf-8')

  return ejs.render(template, data, {})

}
