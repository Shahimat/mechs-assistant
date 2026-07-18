/**
 * Утилиты работы с overlay-мета-полями сущностей каталогов.
 * Работают для любой сущности с `_meta.overlayFields` (Robot, Weapon, …).
 */

interface EntityWithMeta {
  _meta?: {
    overlayFields?: string[];
    overlayUpdatedAt?: string;
    overlaySource?: string;
  };
}

export function hasAnyOverlay(entity: EntityWithMeta): boolean {
  return (entity._meta?.overlayFields?.length ?? 0) > 0;
}

export function isOverlaidField(entity: EntityWithMeta, fieldPath: string): boolean {
  return entity._meta?.overlayFields?.includes(fieldPath) ?? false;
}

/**
 * Проверяет, что путь или любой его дочерний путь переопределён.
 * Пример: `isOverlaidPathOrChildren(entity, 'buyPrice')` вернёт true,
 * если в overlayFields есть `buyPrice.bonds`, `buyPrice.regls` или сам
 * `buyPrice`.
 */
export function isOverlaidPathOrChildren(entity: EntityWithMeta, fieldPath: string): boolean {
  return (
    entity._meta?.overlayFields?.some((f) => f === fieldPath || f.startsWith(`${fieldPath}.`)) ??
    false
  );
}

/** Форматирует дату overlay в русский вид. Пустая строка если даты нет. */
export function formatOverlayDate(entity: EntityWithMeta): string {
  const iso = entity._meta?.overlayUpdatedAt;
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Текст для tooltip'ов при подсвеченных overlay-полях.
 * По решению юзера — только дата, без пояснений.
 * Если даты нет — пустая строка (Tooltip не появится).
 */
export function overlayTooltip(entity: EntityWithMeta): string {
  return formatOverlayDate(entity);
}
