import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import launchIcon from '@img/launch_icon.webp';
import './home.css';

interface GameBuild {
  version_label: string;
  dir_name: string;
  exe_path: string;
}

const STORE_FILE = 'settings.json';
const GAME_DIR_KEY = 'gameDir';

// Пустой путь = использовать дефолт (%LOCALAPPDATA%\MechsEarth\bin), его
// разворачивает Rust. Хранится в tauri-store, переживает перезапуск.
export function HomeView() {
  const [store, setStore] = useState<LazyStore | null>(null);
  const [gameDir, setGameDir] = useState('');
  const [build, setBuild] = useState<GameBuild | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const s = new LazyStore(STORE_FILE);
      setStore(s);
      const saved = (await s.get<string>(GAME_DIR_KEY)) ?? '';
      setGameDir(saved);
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
    setLaunching(true);
    try {
      const started = await invoke<GameBuild>('launch_game', { baseDir: gameDir || null });
      setBuild(started);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="home">
      <section className="section launch-game">
        <h1>Мехи.Земля</h1>
        <p className="muted">
          {build
            ? `Последняя установленная версия: ${build.version_label}`
            : 'Игра не найдена — проверь путь до папки игры в настройках.'}
        </p>

        <button
          type="button"
          className="btn-launch"
          onClick={() => void launch()}
          disabled={launching}
        >
          <img className="btn-launch__icon" src={launchIcon} alt="" aria-hidden />
          {launching ? 'Запуск…' : 'Запустить игру'}
        </button>

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
    </div>
  );
}
