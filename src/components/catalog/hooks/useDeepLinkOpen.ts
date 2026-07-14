import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * URL-параметр (`?open=<key>`) как источник правды для открытого Detail:
 *   - при монтаже/навигации hook читает `open` и открывает соответствующую
 *     запись через `onOpen`;
 *   - клик по карточке в каталоге проходит через `openInUrl(key)` — это
 *     `push`, поэтому браузерная «Назад» откатывает открытие;
 *   - крестик Dialog'а — `clearOpen()` — `replace`, чтобы не засорять
 *     историю пустым состоянием;
 *   - переход URL → open=null (пришли по «Назад» из детали ингредиента)
 *     триггерит `onClose` — Dialog закрывается синхронно с URL.
 */
export function useDeepLinkOpen<T>(
  items: T[],
  getKey: (t: T) => string,
  onOpen: (t: T) => void,
  onClose?: () => void
): {
  openInUrl: (key: string) => void;
  clearOpen: () => void;
} {
  const [params, setParams] = useSearchParams();
  const open = params.get('open');
  const lastOpenedRef = useRef<string | null>(null);

  // Функции getKey/onOpen/onClose держим в ref: эффект должен реагировать
  // на реальное изменение ?open= или dataset, а не на identity колбэков.
  const getKeyRef = useRef(getKey);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  getKeyRef.current = getKey;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      // URL перешёл в «нет открытой детали» (напр. браузерная «Назад»,
      // clearOpen из крестика). Если Dialog был открыт — закрываем.
      if (lastOpenedRef.current !== null) {
        lastOpenedRef.current = null;
        onCloseRef.current?.();
      }
      return;
    }
    if (items.length === 0) return;
    if (lastOpenedRef.current === open) return;
    const found = items.find((i) => getKeyRef.current(i) === open);
    if (found) {
      lastOpenedRef.current = open;
      onOpenRef.current(found);
    }
  }, [open, items]);

  const openInUrl = useCallback(
    (key: string) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('open', key);
          return p;
        },
        { replace: false }
      );
    },
    [setParams]
  );

  const clearOpen = useCallback(() => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('open');
        return p;
      },
      { replace: true }
    );
  }, [setParams]);

  return { openInUrl, clearOpen };
}
