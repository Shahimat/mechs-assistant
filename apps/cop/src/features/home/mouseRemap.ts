import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';

export interface MouseBinding {
  button: string;
  key: string;
}

export interface MouseRemap {
  enabled: boolean;
  bindings: MouseBinding[];
}

export const MOUSE_STORE_FILE = 'settings.json';
export const MOUSE_KEY = 'mouseRemap';

// Дефолт повторяет AHK-скрипт игрока: боковые кнопки мыши шлют цифры 4/6.
export const DEFAULT_REMAP: MouseRemap = {
  enabled: false,
  bindings: [
    { button: 'XButton1', key: '4' },
    { button: 'XButton2', key: '6' },
  ],
};

// Читает сохранённый ребинд из tauri-store и вооружает нативный хук, если он
// включён. Вызывается на старте приложения (App), чтобы биндинги работали
// сразу, не дожидаясь открытия модалки настроек. start_mouse_remap
// идемпотентен, так что повторный арминг из модалки безопасен.
export async function applyStoredMouseRemap(): Promise<void> {
  const store = new LazyStore(MOUSE_STORE_FILE);
  const saved = await store.get<MouseRemap>(MOUSE_KEY);
  if (saved?.enabled) {
    await invoke('start_mouse_remap', { bindings: saved.bindings });
  }
}
