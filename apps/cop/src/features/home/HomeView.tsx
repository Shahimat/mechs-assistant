import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { Camera, FolderOpen, LayoutGrid, Power, Settings } from 'lucide-react';
import launchIcon from '@img/launch_icon.webp';
import { HomeIconButton } from './HomeIconButton';
import { GameSettingsModal } from './GameSettingsModal';
import './home.css';

interface GameBuild {
  version_label: string;
  dir_name: string;
  exe_path: string;
}

interface GameWindow {
  pid: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowLayout {
  slots: LayoutSlot[];
}

interface ArrangeSummary {
  launched: number;
  arranged: number;
  warnings: string[];
}

const STORE_FILE = 'settings.json';
const GAME_DIR_KEY = 'gameDir';
const LAYOUT_KEY = 'windowLayout';

// Пустой путь = использовать дефолт (%LOCALAPPDATA%\MechsEarth\bin), его
// разворачивает Rust. Хранится в tauri-store, переживает перезапуск.
export function HomeView() {
  const [store, setStore] = useState<LazyStore | null>(null);
  const [gameDir, setGameDir] = useState('');
  const [build, setBuild] = useState<GameBuild | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const [layout, setLayout] = useState<WindowLayout | null>(null);
  const [remembering, setRemembering] = useState(false);
  const [layoutInfo, setLayoutInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = new LazyStore(STORE_FILE);
      setStore(s);
      const saved = (await s.get<string>(GAME_DIR_KEY)) ?? '';
      setGameDir(saved);
      setLayout((await s.get<WindowLayout>(LAYOUT_KEY)) ?? null);
      await refresh(saved);
    })();
  }, []);

  async function refresh(dir: string) {
    try {
      const found = await invoke<GameBuild>('find_latest_game', { baseDir: dir || null });
      setBuild(found);
      setError(null);
    } catch (e) {
      setBuild(null);
      setError(String(e));
    }
  }

  async function saveDir(dir: string) {
    setGameDir(dir);
    if (store) {
      await store.set(GAME_DIR_KEY, dir);
      await store.save();
    }
    await refresh(dir);
  }

  async function launch() {
    // Гард от дабл-клика/спама: один клик = один инстанс. Пока идёт запуск
    // и ещё ~400мс после — повторный клик игнорируется. Осознанный мультизапуск
    // (несколько окон) — отдельная кнопка раскладки, см. goal--cop-launch-game.
    if (launching || cooldown) return;
    setLaunching(true);
    try {
      const started = await invoke<GameBuild>('launch_game', { baseDir: gameDir || null });
      setBuild(started);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLaunching(false);
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 400);
    }
  }

  async function closeAll() {
    setClosing(true);
    try {
      await invoke('close_all_games');
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setClosing(false);
    }
  }

  async function openFolder() {
    try {
      await invoke('open_game_folder', { baseDir: gameDir || null });
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }

  // «Запомни как сейчас»: считываем текущие окна игры и сохраняем их
  // геометрию как пресет (по слоту на окно). Ручного ввода координат нет.
  async function rememberLayout() {
    if (!store) return;
    setRemembering(true);
    try {
      const windows = await invoke<GameWindow[]>('list_game_windows');
      if (windows.length === 0) {
        setError('Не найдено ни одного окна игры — сначала открой и расставь окна.');
        return;
      }
      const next: WindowLayout = {
        slots: windows.map((w) => ({ x: w.x, y: w.y, width: w.width, height: w.height })),
      };
      await store.set(LAYOUT_KEY, next);
      await store.save();
      setLayout(next);
      setLayoutInfo(`Запомнена раскладка на ${next.slots.length} окон.`);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setRemembering(false);
    }
  }

  // Мультизапуск: N = число слотов пресета. Тот же кулдаун-гард, что у
  // одиночного запуска (launching/cooldown) — осознанный запуск N штук
  // одной операцией, повторный клик по ней тоже гасим.
  async function launchAndArrange() {
    if (launching || cooldown || !layout) return;
    setLaunching(true);
    try {
      const summary = await invoke<ArrangeSummary>('launch_and_arrange', {
        baseDir: gameDir || null,
        slots: layout.slots,
      });
      setLayoutInfo(
        `Запущено ${summary.launched}, размещено ${summary.arranged}` +
          (summary.warnings.length ? `. ${summary.warnings.join('; ')}` : '.')
      );
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLaunching(false);
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 400);
    }
  }

  return (
    <div className="home">
      <section className="section launch-game">
        <p className="muted">
          {build
            ? `Последняя установленная версия: ${build.version_label}`
            : 'Игра не найдена — проверь путь до папки игры в настройках.'}
        </p>

        <div className="home-icon-row">
          <HomeIconButton
            title="Запустить игру"
            description={
              build
                ? `Запуск последней версии ${build.version_label}`
                : 'Запуск последней установленной версии игры'
            }
            imgSrc={launchIcon}
            variant="accent"
            busy={launching}
            disabled={launching || cooldown}
            onClick={() => void launch()}
          />

          <HomeIconButton
            title="Открыть папку игры"
            description="Открыть каталог MechsEarth в проводнике"
            icon={FolderOpen}
            onClick={() => void openFolder()}
          />

          <HomeIconButton
            title="Настройки игры"
            description="Редактор UserDefault.xml: параметры, регданные, ребинд"
            icon={Settings}
            onClick={() => setShowGameSettings(true)}
          />

          <HomeIconButton
            title="Закрыть все сессии"
            description="Форсированно закрыть все окна игры (taskkill)"
            icon={Power}
            variant="danger"
            busy={closing}
            disabled={closing}
            onClick={() => void closeAll()}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="button" className="link-toggle" onClick={() => setShowSettings((v) => !v)}>
          {showSettings ? 'Скрыть настройки пути' : 'Настроить путь до игры'}
        </button>

        {showSettings && (
          <div className="game-dir-settings">
            <p className="muted">
              Папка игры. Пусто = по умолчанию <code>%LOCALAPPDATA%\MechsEarth\bin</code>. COP сам
              выбирает подпапку с самой свежей версией.
            </p>
            <div className="row">
              <input
                type="text"
                placeholder="%LOCALAPPDATA%\MechsEarth\bin"
                value={gameDir}
                onChange={(e) => setGameDir(e.currentTarget.value)}
              />
              <button type="button" onClick={() => void saveDir(gameDir)}>
                Сохранить
              </button>
              <button type="button" onClick={() => void saveDir('')}>
                Сброс
              </button>
            </div>
            {build && (
              <p className="muted">
                Найдено: <code>{build.exe_path}</code>
              </p>
            )}
          </div>
        )}
      </section>

      <section className="section window-layout">
        <h2>Раскладка окон</h2>
        <p className="muted">
          {layout
            ? `Сохранён пресет на ${layout.slots.length} окон.`
            : 'Пресет не сохранён. Открой и расставь окна игры как удобно, затем запомни.'}
        </p>

        <div className="home-icon-row">
          <HomeIconButton
            title="Запомнить текущую раскладку"
            description="Считать позиции открытых окон игры и сохранить пресет"
            icon={Camera}
            busy={remembering}
            disabled={remembering}
            onClick={() => void rememberLayout()}
          />

          <HomeIconButton
            title="Запустить и разложить"
            description="Запустить N инстансов и расставить окна по пресету"
            icon={LayoutGrid}
            variant="accent"
            busy={launching}
            disabled={launching || cooldown || !layout}
            onClick={() => void launchAndArrange()}
          />
        </div>

        {layoutInfo && <p className="muted layout-info">{layoutInfo}</p>}
      </section>

      {showGameSettings && (
        <GameSettingsModal gameDir={gameDir} onClose={() => setShowGameSettings(false)} />
      )}
    </div>
  );
}
