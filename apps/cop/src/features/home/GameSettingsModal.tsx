import { useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { RotateCcw, Save, Trash2, X } from 'lucide-react';
import { HomeIconButton } from './HomeIconButton';

interface SettingEntry {
  key: string;
  type: string;
  value: string;
}

interface MouseBinding {
  button: string;
  key: string;
}

interface MouseRemap {
  enabled: boolean;
  bindings: MouseBinding[];
}

const STORE_FILE = 'settings.json';
const MOUSE_KEY = 'mouseRemap';

// Дефолт повторяет AHK-скрипт игрока: боковые кнопки мыши шлют цифры 4/6.
const DEFAULT_REMAP: MouseRemap = {
  enabled: false,
  bindings: [
    { button: 'XButton1', key: '4' },
    { button: 'XButton2', key: '6' },
  ],
};

const BUTTON_LABEL: Record<string, string> = {
  XButton1: 'Боковая 1 (XButton1)',
  XButton2: 'Боковая 2 (XButton2)',
  Middle: 'Средняя',
};

// Регданные редактор не показывает — тронуть их можно только «Удалить
// регданные» (strip_registration). См. view--cop-home-edits-game-settings.
const REG_KEYS = new Set(['LastEmail', 'LicenseKey']);

// Непрозрачные блобы: base64-настройки UI и цветовые пресеты. Редактировать
// вручную бессмысленно/опасно — показываем, но виджет заблокирован.
function isOpaque(key: string): boolean {
  return key === 'UI:Setting' || key.startsWith('Game:Colors:');
}

// Группа = префикс до первого `:`. Ключи без `:` идут в «Общие».
function groupOf(key: string): string {
  const idx = key.indexOf(':');
  return idx === -1 ? 'Общие' : key.slice(0, idx);
}

// Хвост ключа после последнего `:` — как подпись строки (префикс уже в
// заголовке группы).
function labelOf(key: string): string {
  const idx = key.lastIndexOf(':');
  return idx === -1 ? key : key.slice(idx + 1);
}

export function GameSettingsModal({ gameDir, onClose }: { gameDir: string; onClose: () => void }) {
  const [entries, setEntries] = useState<SettingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Ключ, для которого сейчас захватываем нажатие клавиши (Keyboard:*).
  const [capturing, setCapturing] = useState<string | null>(null);
  const capturingRef = useRef<string | null>(null);
  capturingRef.current = capturing;

  const [remap, setRemap] = useState<MouseRemap>(DEFAULT_REMAP);

  const baseDir = gameDir || null;
  const store = useMemo(() => new LazyStore(STORE_FILE), []);

  // Начальный loading=true покрывает монтирование; при restore индикатор не
  // нужен — там активен флаг busy.
  async function load() {
    try {
      const all = await invoke<SettingEntry[]>('read_game_settings', { baseDir });
      setEntries(all.filter((e) => !REG_KEYS.has(e.key)));
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // Загрузка при монтировании — инлайновый IIFE (setState синхронно в теле
  // эффекта запрещён правилом set-state-in-effect).
  useEffect(() => {
    void (async () => {
      try {
        const all = await invoke<SettingEntry[]>('read_game_settings', { baseDir });
        setEntries(all.filter((e) => !REG_KEYS.has(e.key)));
        setError(null);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [baseDir]);

  // Захват клавиши для Keyboard:*-ключа: слушаем один keydown, пишем код.
  useEffect(() => {
    if (!capturing) return;
    function onKey(ev: KeyboardEvent) {
      ev.preventDefault();
      const target = capturingRef.current;
      if (!target) return;
      setValue(target, ev.code);
      setCapturing(null);
    }
    window.addEventListener('keydown', onKey, { once: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [capturing]);

  // Ребинд мыши из tauri-store (переживает перезапуск). Если сохранён как
  // включённый — заново вооружаем хук, чтобы отображение совпадало с реальным
  // состоянием (start идемпотентен). См. view--cop-home-edits-game-settings.
  useEffect(() => {
    void (async () => {
      const saved = await store.get<MouseRemap>(MOUSE_KEY);
      if (!saved) return;
      setRemap(saved);
      if (saved.enabled) {
        try {
          await invoke('start_mouse_remap', { bindings: saved.bindings });
        } catch (e) {
          setError(String(e));
        }
      }
    })();
  }, [store]);

  async function persistRemap(next: MouseRemap) {
    setRemap(next);
    await store.set(MOUSE_KEY, next);
    await store.save();
  }

  async function toggleRemap() {
    const next: MouseRemap = { ...remap, enabled: !remap.enabled };
    try {
      if (next.enabled) await invoke('start_mouse_remap', { bindings: next.bindings });
      else await invoke('stop_mouse_remap');
      await persistRemap(next);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function setBindingKey(button: string, key: string) {
    const bindings = remap.bindings.map((b) => (b.button === button ? { ...b, key } : b));
    const next: MouseRemap = { ...remap, bindings };
    try {
      // На лету перевооружаем хук только если ребинд включён.
      if (next.enabled) await invoke('start_mouse_remap', { bindings });
      await persistRemap(next);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }

  function setValue(key: string, value: string) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, value } : e)));
  }

  async function save() {
    setBusy(true);
    try {
      await invoke('write_game_settings', { baseDir, entries });
      setInfo('Настройки сохранены.');
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    try {
      await invoke('restore_game_settings', { baseDir });
      await load();
      setInfo('Настройки возвращены к бэкапу (регданные сохранены).');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteRegistration() {
    setBusy(true);
    try {
      await invoke('strip_registration', { baseDir });
      setInfo('Регистрационные данные удалены из конфига.');
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const groups = new Map<string, SettingEntry[]>();
  for (const e of entries) {
    const g = groupOf(e.key);
    const list = groups.get(g);
    if (list) list.push(e);
    else groups.set(g, [e]);
  }

  function renderWidget(e: SettingEntry) {
    if (isOpaque(e.key)) {
      return <input className="settings-input" type="text" value={e.value} disabled />;
    }
    if (e.key.startsWith('Keyboard:')) {
      const active = capturing === e.key;
      return (
        <button
          type="button"
          className="settings-capture"
          onClick={() => setCapturing(active ? null : e.key)}
        >
          {active ? 'Нажми клавишу…' : e.value || '—'}
        </button>
      );
    }
    if (e.type === 'bool') {
      const on = e.value === 'true' || e.value === '1';
      return (
        <button
          type="button"
          className={`settings-toggle${on ? ' settings-toggle--on' : ''}`}
          role="switch"
          aria-checked={on}
          onClick={() => setValue(e.key, on ? 'false' : 'true')}
        >
          <span className="settings-toggle__knob" />
        </button>
      );
    }
    if (e.type === 'int' || e.type === 'float') {
      return (
        <input
          className="settings-input"
          type="number"
          step={e.type === 'float' ? 'any' : 1}
          value={e.value}
          onChange={(ev) => setValue(e.key, ev.currentTarget.value)}
        />
      );
    }
    return (
      <input
        className="settings-input"
        type="text"
        value={e.value}
        onChange={(ev) => setValue(e.key, ev.currentTarget.value)}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(ev) => ev.stopPropagation()}>
        <div className="modal__head">
          <h2>Настройки игры</h2>
          <div className="home-icon-row">
            <HomeIconButton
              title="Сохранить"
              description="Записать изменения в UserDefault.xml"
              icon={Save}
              variant="accent"
              busy={busy}
              disabled={busy || loading}
              onClick={() => void save()}
            />
            <HomeIconButton
              title="Вернуть как было"
              description="Применить бэкап (текущие регданные сохраняются)"
              icon={RotateCcw}
              busy={busy}
              disabled={busy || loading}
              onClick={() => void restore()}
            />
            <HomeIconButton
              title="Удалить регданные"
              description="Стереть email и лицензионный ключ из конфига"
              icon={Trash2}
              variant="danger"
              busy={busy}
              disabled={busy || loading}
              onClick={() => void deleteRegistration()}
            />
            <HomeIconButton
              title="Закрыть"
              description="Закрыть редактор без сохранения"
              icon={X}
              onClick={onClose}
            />
          </div>
        </div>

        <div className="modal__body">
          {loading && <p className="muted">Загрузка…</p>}
          {error && <div className="error">{error}</div>}
          {info && <p className="muted">{info}</p>}

          <div className="settings-group">
            <h3 className="settings-group__title">Ребинд мыши</h3>
            <div className="settings-row">
              <span className="settings-row__label">
                Слать клавишу в активное окно игры по кнопке мыши
              </span>
              <button
                type="button"
                className={`settings-toggle${remap.enabled ? ' settings-toggle--on' : ''}`}
                role="switch"
                aria-checked={remap.enabled}
                onClick={() => void toggleRemap()}
              >
                <span className="settings-toggle__knob" />
              </button>
            </div>
            {remap.bindings.map((b) => (
              <div key={b.button} className="settings-row">
                <span className="settings-row__label">{BUTTON_LABEL[b.button] ?? b.button}</span>
                <input
                  className="settings-input"
                  type="text"
                  maxLength={1}
                  value={b.key}
                  placeholder="клавиша"
                  onChange={(ev) => void setBindingKey(b.button, ev.currentTarget.value)}
                />
              </div>
            ))}
          </div>

          {!loading &&
            [...groups.entries()].map(([group, list]) => (
              <div key={group} className="settings-group">
                <h3 className="settings-group__title">{group}</h3>
                {list.map((e) => (
                  <div key={e.key} className="settings-row">
                    <span className="settings-row__label" title={e.key}>
                      {labelOf(e.key)}
                    </span>
                    {renderWidget(e)}
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
