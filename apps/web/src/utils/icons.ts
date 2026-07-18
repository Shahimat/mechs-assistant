export const ICONS_BASE_URL = 'data/icons/';

export function resolveIconUrl(iconPath: string): string {
  return `${__webpack_public_path__}${ICONS_BASE_URL}${iconPath}`;
}
