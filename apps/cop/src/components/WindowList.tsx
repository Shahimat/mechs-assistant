import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WindowInfo } from '@/types';

interface WindowListProps {
  /** Клик по строке пробрасывает title наверх — юзер быстро выбирает целевое окно. */
  onPick?: (title: string) => void;
}

export function WindowList({ onPick }: WindowListProps) {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  async function refresh() {
    try {
      const list = await invoke<WindowInfo[]>('list_windows');
      setWindows(list);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    // refresh() ставит state только после `await invoke(...)` — это
    // асинхронно, каскадных синхронных рендеров нет. Правило-эвристика
    // ложно срабатывает на легитимный mount-fetch через IPC.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  const filtered = filter
    ? windows.filter((w) => w.title.toLowerCase().includes(filter.toLowerCase()))
    : windows;

  return (
    <div className="window-list">
      <div className="row">
        <input
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          placeholder="Фильтр по заголовку"
        />
        <button type="button" onClick={() => void refresh()}>
          Обновить
        </button>
      </div>
      {error && (
        <p className="error">
          Ошибка: <code>{error}</code>
        </p>
      )}
      <p className="muted">
        Найдено: {filtered.length} из {windows.length}
      </p>
      <ul className="windows">
        {filtered.map((w) => (
          <li key={`${w.id}-${w.title}`}>
            <button type="button" className="link" onClick={() => onPick?.(w.title)}>
              <span className="title">{w.title || '(без заголовка)'}</span>
              <span className="meta">
                {w.width}×{w.height}
                {w.is_minimized && ' · minimized'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
