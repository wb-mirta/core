import fs from 'node:fs'
import path from 'node:path'
import sortDependencies from './sort-dependencies'
import renderJson from './render-json'

function renderTemplate(sourcePath: string, targetPath: string) {

  const stats = fs.statSync(sourcePath)

  if (stats.isDirectory()) {

    if (path.basename(sourcePath) === 'node_modules')
      return

    fs.mkdirSync(targetPath, { recursive: true })

    for (const file of fs.readdirSync(sourcePath)) {

      if (file === '.gitkeep')
        continue

      renderTemplate(path.resolve(sourcePath, file), path.resolve(targetPath, file))

    }

    return

  }

  const filename = path.basename(sourcePath)

  if (filename === 'package.json' && fs.existsSync(targetPath)) {

    renderJson(sourcePath, targetPath, result => sortDependencies(result))
    return

  }

  if (['extensions.json', 'settings.json', 'tasks.json', 'tsconfig.json'].includes(filename) && fs.existsSync(targetPath)) {

    renderJson(sourcePath, targetPath)
    return

  }

  if (filename.startsWith('_')) {

    // rename `_file` to `.file`
    targetPath = path.resolve(path.dirname(targetPath), filename.replace(/^_/, '.'))

  }

  if (filename === '_gitignore' && fs.existsSync(targetPath)) {

    const existingContent = fs.readFileSync(targetPath, 'utf-8')
    const newContent = fs.readFileSync(sourcePath, 'utf-8')

    fs.writeFileSync(targetPath, existingContent + '\n' + newContent)
    return

  }

  fs.copyFileSync(sourcePath, targetPath)

}

export default renderTemplate
