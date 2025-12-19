/**
 * Рекомендуемая группа для безопасного развертывания.
 *
 * Отдельная группа изолирует разработчиков,
 * предотвращая случайное изменение или удаление важных системных файлов.
 *
 * @example
 * ```bash
 * sudo groupadd -f developers
 * sudo usermod -aG developers deploy-user
 * ```
 *
 * @since 0.4.0
 *
 **/
export const RECOMMENDED_GROUP = 'developers'
