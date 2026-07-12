import type { Robot } from '../types/robot';

export function hasAnyOverlay(robot: Robot): boolean {
  return (robot._meta?.overlayFields?.length ?? 0) > 0;
}

export function isOverlaidField(robot: Robot, fieldPath: string): boolean {
  return robot._meta?.overlayFields?.includes(fieldPath) ?? false;
}

/**
 * Проверяет, что путь или любой его дочерний путь переопределён.
 * Пример: `isOverlaidPathOrChildren(robot, 'buyPrice')` вернёт true,
 * если в overlayFields есть `buyPrice.bonds`, `buyPrice.regls` или сам
 * `buyPrice`.
 */
export function isOverlaidPathOrChildren(robot: Robot, fieldPath: string): boolean {
  return (
    robot._meta?.overlayFields?.some(
      (f) => f === fieldPath || f.startsWith(`${fieldPath}.`)
    ) ?? false
  );
}

/** Форматирует дату overlay в русский вид. Пустая строка если даты нет. */
export function formatOverlayDate(robot: Robot): string {
  const iso = robot._meta?.overlayUpdatedAt;
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
export function overlayTooltip(robot: Robot): string {
  return formatOverlayDate(robot);
}
