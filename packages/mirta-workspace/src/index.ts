// ======================================================
// 🚀 Основные функции пакета
// ======================================================

export {

  resolveWorkspaceContextAsync,
  type WorkspaceContext,
  type PackageManager

} from './context/workspace'

export {

  resolveMonorepoContextAsync,
  type MonorepoContext,
  type PackageDefinition

} from './context/monorepo'

// =======================================================
// 🔧 Вспомогательные утилиты для продвинутых сценариев
// =======================================================

export { toPosix } from './path'
