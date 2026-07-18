import { useEffect, useState } from 'react';
import { LazyStore } from '@tauri-apps/plugin-store';
import { DEFAULT_GRID, type GridConfig } from '../pipeline/recognize';

interface GridSettingsProps {
  onChange: (grid: GridConfig) => void;
}

const STORE_FILE = 'settings.json';
const GRID_KEY = 'grid';

/**
 * Форма калибровки сетки инвентаря. Значения сохраняются в
 * tauri-plugin-store (settings.json в user data dir) — переживают
 * перезапуск.
 */
export function GridSettings({ onChange }: GridSettingsProps) {
  const [grid, setGrid] = useState<GridConfig>(DEFAULT_GRID);
  const [store, setStore] = useState<LazyStore | null>(null);

  useEffect(() => {
    (async () => {
      const s = new LazyStore(STORE_FILE);
      setStore(s);
      const saved = await s.get<GridConfig>(GRID_KEY);
      if (saved) {
        setGrid(saved);
        onChange(saved);
      } else {
        onChange(DEFAULT_GRID);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function update(patch: Partial<GridConfig>) {
    const next = { ...grid, ...patch };
    setGrid(next);
    onChange(next);
    if (store) {
      await store.set(GRID_KEY, next);
      await store.save();
    }
  }

  async function resetToDefaults() {
    setGrid(DEFAULT_GRID);
    onChange(DEFAULT_GRID);
    if (store) {
      await store.set(GRID_KEY, DEFAULT_GRID);
      await store.save();
    }
  }

  return (
    <div className="grid-settings">
      <p className="muted">
        Сетка ячеек инвентаря. Значения запоминаются между запусками. Если распознавание
        промахивается — подстрой размер ячейки на пару пикселей.
      </p>
      <div className="grid-form">
        <label>
          <span>offset X</span>
          <input
            type="number"
            value={grid.offset_x}
            onChange={(e) => void update({ offset_x: Number(e.currentTarget.value) })}
          />
        </label>
        <label>
          <span>offset Y</span>
          <input
            type="number"
            value={grid.offset_y}
            onChange={(e) => void update({ offset_y: Number(e.currentTarget.value) })}
          />
        </label>
        <label>
          <span>cell size</span>
          <input
            type="number"
            min={16}
            max={128}
            value={grid.cell_size}
            onChange={(e) => void update({ cell_size: Number(e.currentTarget.value) })}
          />
        </label>
        <label>
          <span>cols</span>
          <input
            type="number"
            min={1}
            max={12}
            value={grid.cols}
            onChange={(e) => void update({ cols: Number(e.currentTarget.value) })}
          />
        </label>
        <label>
          <span>rows</span>
          <input
            type="number"
            min={1}
            max={12}
            value={grid.rows}
            onChange={(e) => void update({ rows: Number(e.currentTarget.value) })}
          />
        </label>
        <button type="button" onClick={() => void resetToDefaults()}>
          Сброс
        </button>
      </div>
    </div>
  );
}
