import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { LazyStore } from '@tauri-apps/plugin-store';
import './App.css';
import { WindowList } from './components/WindowList';
import { CaptureView } from './components/CaptureView';
import { InventoryResult } from './components/InventoryResult';
import { GridSettings } from './components/GridSettings';
import { UpdateBanner } from './components/UpdateBanner';
import {
  DEFAULT_GRID,
  recognizePage,
  type GridConfig,
  type InventoryCorner,
} from './pipeline/recognize';
import { mergeSeries } from './pipeline/mergeSeries';
import { buildDiagnosticZip, saveZip } from './pipeline/diagnostic';
import type { CapturedWindow, Recognized, SeriesState } from './types';

const CAPTURE_HOTKEY = 'Alt+Q';
const SERIES_PAGE_HOTKEY = 'Alt+Shift+Q';
const SERIES_END_HOTKEY = 'Alt+Ctrl+Shift+Q';

const STORE_FILE = 'settings.json';
const TITLE_PATTERN_KEY = 'titlePattern';

function App() {
  const [titlePattern, setTitlePattern] = useState('');
  const titleStoreRef = useRef<LazyStore | null>(null);
  // Phase K: перехватываем console.warn/error за сессию, чтобы уложить
  // в diagnostic-ZIP. Ref, а не state — не нужно ре-рендерить UI.
  const logRef = useRef<string[]>([]);
  const [captured, setCaptured] = useState<CapturedWindow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recognized, setRecognized] = useState<Recognized[]>([]);
  const [corner, setCorner] = useState<InventoryCorner | null>(null);
  const [series, setSeries] = useState<SeriesState>({ active: false, pages: [] });
  const [grid, setGrid] = useState<GridConfig>(DEFAULT_GRID);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  // Handlers, к которым обращаются глобальные хоткеи, замыкают state на
  // момент регистрации. Чтобы всегда читать актуальные значения, держим
  // «живые» handler'ы в ref — коллбэк из tauri-plugin просто вызывает
  // ref.current().
  const handleCaptureRef = useRef<() => void>(() => {});
  const handleSeriesPageRef = useRef<() => void>(() => {});
  const handleSeriesEndRef = useRef<() => void>(() => {});

  async function captureNow(): Promise<CapturedWindow | null> {
    setError(null);
    if (!titlePattern.trim()) {
      setError('Сначала укажи часть заголовка целевого окна.');
      return null;
    }
    try {
      const result = await invoke<CapturedWindow>('capture_window', {
        titlePattern,
      });
      setCaptured(result);
      return result;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }

  async function handleCapture() {
    const cap = await captureNow();
    if (!cap) return;
    try {
      const { items, corner: c } = await recognizePage(cap, grid);
      setRecognized(items);
      setCorner(c);
    } catch (e) {
      setError(`Ошибка распознавания: ${e}`);
    }
  }

  async function handleSeriesPage() {
    const cap = await captureNow();
    if (!cap) return;
    try {
      const { items, corner: c } = await recognizePage(cap, grid);
      setCorner(c);
      setSeries((s) => ({
        active: true,
        pages: [...s.pages, items],
      }));
    } catch (e) {
      setError(`Ошибка распознавания страницы серии: ${e}`);
    }
  }

  function handleSeriesEnd() {
    if (!series.active) return;
    setRecognized(mergeSeries(series.pages));
    setSeries({ active: false, pages: [] });
  }

  // Постоянно обновляем refs — гарантируем актуальный state в хоткеях.
  handleCaptureRef.current = handleCapture;
  handleSeriesPageRef.current = handleSeriesPage;
  handleSeriesEndRef.current = handleSeriesEnd;

  useEffect(() => {
    (async () => {
      try {
        await unregisterAll();
        await register(CAPTURE_HOTKEY, (e) => {
          if (e.state === 'Pressed') handleCaptureRef.current();
        });
        await register(SERIES_PAGE_HOTKEY, (e) => {
          if (e.state === 'Pressed') handleSeriesPageRef.current();
        });
        await register(SERIES_END_HOTKEY, (e) => {
          if (e.state === 'Pressed') handleSeriesEndRef.current();
        });
      } catch (err) {
        setError(`Не удалось зарегистрировать хоткеи: ${err}`);
      }
    })();
    return () => {
      void unregisterAll();
    };
  }, []);

  // Персистим titlePattern в тот же settings.json (LazyStore дедуп-ит
  // instances по имени файла на Rust-стороне). Читаем один раз при
  // монтировании, пишем при каждом изменении.
  useEffect(() => {
    (async () => {
      const s = new LazyStore(STORE_FILE);
      titleStoreRef.current = s;
      const saved = await s.get<string>(TITLE_PATTERN_KEY);
      if (saved) setTitlePattern(saved);
    })();
  }, []);

  useEffect(() => {
    const s = titleStoreRef.current;
    if (!s) return;
    void (async () => {
      await s.set(TITLE_PATTERN_KEY, titlePattern);
      await s.save();
    })();
  }, [titlePattern]);

  // Глобальный перехват console.warn/error за сессию — все ошибки
  // pipeline'а и Rust-команд, которые печатались в консоль, попадают в
  // diagnostic-ZIP. Оригинальные методы вызываются как раньше, поэтому
  // devtools продолжают работать штатно.
  useEffect(() => {
    const origWarn = console.warn;
    const origError = console.error;
    const capture = (level: 'WARN' | 'ERROR', orig: typeof console.warn) => {
      return (...args: unknown[]) => {
        const line = `[${new Date().toISOString()}] ${level}: ${args
          .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
          .join(' ')}`;
        logRef.current.push(line);
        if (logRef.current.length > 500) logRef.current.shift();
        orig(...args);
      };
    };
    console.warn = capture('WARN', origWarn);
    console.error = capture('ERROR', origError);
    return () => {
      console.warn = origWarn;
      console.error = origError;
    };
  }, []);

  async function handleExportDiagnostic() {
    setError(null);
    setSavedPath(null);
    try {
      const bytes = await buildDiagnosticZip({
        captured,
        corner,
        grid,
        recognized,
        seriesPageCount: series.pages.length,
        logLines: logRef.current.slice(),
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = await saveZip(bytes, `inventory-parser-diagnostic-${stamp}.zip`);
      if (path) setSavedPath(path);
    } catch (e) {
      setError(`Ошибка экспорта диагностики: ${e}`);
    }
  }

  return (
    <main className="container">
      <UpdateBanner />
      <h1>Inventory Parser</h1>

      <section className="section">
        <h2>Целевое окно</h2>
        <div className="row">
          <input
            value={titlePattern}
            onChange={(e) => setTitlePattern(e.currentTarget.value)}
            placeholder="Часть заголовка (например, никнейм меха)"
          />
          <button
            type="button"
            onClick={() => void handleCapture()}
            disabled={!titlePattern.trim()}
          >
            Снять сейчас
          </button>
        </div>
        <p className="muted">
          Горячие клавиши: <code>{CAPTURE_HOTKEY}</code> — снять одну страницу.{' '}
          <code>{SERIES_PAGE_HOTKEY}</code> — очередная страница серии.{' '}
          <code>{SERIES_END_HOTKEY}</code> — закрыть серию и слить страницы.
        </p>
        {series.active && (
          <p className="muted">
            Серия активна: {series.pages.length} стр. Жми {SERIES_PAGE_HOTKEY} для следующей или{' '}
            {SERIES_END_HOTKEY}, чтобы завершить.
          </p>
        )}
        {error && (
          <p className="error">
            Ошибка: <code>{error}</code>
          </p>
        )}
      </section>

      <section className="section">
        <h2>Настройки сетки</h2>
        <GridSettings onChange={setGrid} />
      </section>

      {captured && (
        <section className="section">
          <h2>Скрин окна</h2>
          <CaptureView captured={captured} corner={corner} grid={grid} />
        </section>
      )}

      {captured && (
        <section className="section">
          <h2>Диагностика</h2>
          <p className="muted">
            ZIP с полным state сессии (скрин + оверлей + все ячейки-кропы + лог) — для отправки
            агенту одним файлом, без множественных скринов.
          </p>
          <button type="button" onClick={() => void handleExportDiagnostic()}>
            Сохранить диагностику…
          </button>
          {savedPath && (
            <p className="muted">
              Сохранено: <code>{savedPath}</code>
            </p>
          )}
        </section>
      )}

      {recognized.length > 0 && (
        <section className="section">
          <h2>Распознано</h2>
          <InventoryResult items={recognized} />
        </section>
      )}

      <section className="section">
        <h2>Все окна ОС</h2>
        <WindowList onPick={(title) => setTitlePattern(title)} />
      </section>
    </main>
  );
}

export default App;
