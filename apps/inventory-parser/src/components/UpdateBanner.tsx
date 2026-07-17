import { useEffect, useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

/**
 * Phase L2: проверяет наличие обновления через `@tauri-apps/plugin-updater`
 * (endpoint и pubkey — в tauri.conf.json). Если новая версия доступна —
 * рисует баннер сверху приложения с кнопкой «Обновить сейчас».
 *
 * Тихо игнорирует ошибки — в dev-режиме updater не работает
 * (нет signed сборки, endpoint не отвечает), это нормально.
 */
type Status = 'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error';

export function UpdateBanner() {
  const [status, setStatus] = useState<Status>('idle');
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<{ downloaded: number; total: number | null }>({
    downloaded: 0,
    total: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus('checking');
    check()
      .then((u) => {
        if (u) {
          setUpdate(u);
          setStatus('available');
        } else {
          setStatus('idle');
        }
      })
      .catch((err) => {
        console.warn('UpdateBanner: check() failed (normal in dev)', err);
        setStatus('idle');
      });
  }, []);

  async function handleInstall() {
    if (!update) return;
    setStatus('downloading');
    setErrorMessage(null);
    try {
      let downloaded = 0;
      let total: number | null = null;
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? null;
          setProgress({ downloaded: 0, total });
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          setProgress({ downloaded, total });
        } else if (event.event === 'Finished') {
          setStatus('installing');
        }
      });
      // После установки — рестарт (Tauri заменяет бинарь).
      await relaunch();
    } catch (err) {
      console.error('UpdateBanner: install failed', err);
      setErrorMessage(String(err));
      setStatus('error');
    }
  }

  if (status === 'idle' || status === 'checking') return null;

  const percent =
    progress.total && progress.total > 0
      ? Math.round((progress.downloaded / progress.total) * 100)
      : null;

  return (
    <div className="update-banner">
      {status === 'available' && update && (
        <>
          <span>
            Доступна новая версия <strong>{update.version}</strong> (текущая {update.currentVersion}
            ).
          </span>
          <button type="button" onClick={() => void handleInstall()}>
            Обновить сейчас
          </button>
        </>
      )}
      {status === 'downloading' && (
        <span>Скачиваю обновление{percent !== null ? ` — ${percent}%` : '…'}</span>
      )}
      {status === 'installing' && <span>Устанавливаю, приложение перезапустится…</span>}
      {status === 'error' && (
        <span className="update-banner__error">
          Ошибка обновления: <code>{errorMessage}</code>
        </span>
      )}
    </div>
  );
}
