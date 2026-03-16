import type { StateCreator, StoreApi } from 'zustand';

/**
 * Конфигурация для indexedDB middleware
 */
interface IndexedDBConfig {
  /** Имя базы данных */
  dbName: string;
  /** Версия базы данных */
  dbVersion: number;
  /** Имя хранилища (object store) */
  storeName: string;
  /** Ключи состояния, которые нужно сохранять в indexedDB */
  persistKeys: string[];
}

type SetState<T> = StoreApi<T>['setState'];
type GetState<T> = StoreApi<T>['getState'];

function initIndexedDB(
  dbName: string,
  dbVersion: number,
  storeName: string
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = () => {
      reject(new Error(`Ошибка открытия базы данных: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}

async function getFromIndexedDB<T>(
  db: IDBDatabase,
  storeName: string,
  key: string
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => {
      reject(new Error(`Ошибка чтения из базы данных: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result ?? null);
    };
  });
}

async function setToIndexedDB<T>(
  db: IDBDatabase,
  storeName: string,
  key: string,
  value: T
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);

    request.onerror = () => {
      reject(new Error(`Ошибка записи в базу данных: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Zustand middleware для персистенции произвольных ключей состояния в indexedDB
 */
type PersistedState = {
  _persistHydrated?: boolean;
  robots?: Array<{ key: string }>;
};

export function indexedDBMiddleware<T extends PersistedState>(
  config: IndexedDBConfig
): (stateCreator: StateCreator<T>) => StateCreator<T> {
  let db: IDBDatabase | null = null;
  let isInitialized = false;
  let initPromise: Promise<void> | null = null;

  const initializeDB = async (): Promise<void> => {
    if (isInitialized && db) {
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      try {
        db = await initIndexedDB(config.dbName, config.dbVersion, config.storeName);
        isInitialized = true;
      } catch (error) {
        console.error('Ошибка инициализации indexedDB:', error);
        throw error;
      }
    })();

    return initPromise;
  };

  return (stateCreator: StateCreator<T>) =>
    (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => {
    initializeDB().catch((error) => {
      console.error('Не удалось инициализировать indexedDB:', error);
    });

    const loadPersistedState = async (): Promise<void> => {
      try {
        await initializeDB();
        if (!db) {
          return;
        }

        const patch: Record<string, unknown> = {};
        for (const key of config.persistKeys) {
          const saved = await getFromIndexedDB<unknown>(db, config.storeName, key);
          if (saved !== null) {
            patch[key] = saved;
          }
        }

        set({ _persistHydrated: true } as Partial<T>);

        if (Object.keys(patch).length > 0) {
          set(patch as Partial<T>);
        } else {
          // Если в indexedDB ничего нет — ставим baseRobotKey первого робота
          const state = get();
          if (
            state.robots &&
            state.robots.length > 0 &&
            'baseRobotKey' in state &&
            (state as Record<string, unknown>).baseRobotKey === null
          ) {
            set({ baseRobotKey: state.robots[0].key } as unknown as Partial<T>);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки данных из indexedDB:', error);
        set({ _persistHydrated: true } as Partial<T>);
      }
    };

    loadPersistedState();

    const setWithPersistence = (
      partial: Partial<T> | ((state: T) => Partial<T>),
      replace?: boolean
    ): void => {
      const nextState = typeof partial === 'function' ? partial(get()) : partial;
      const currentState = get();

      for (const key of config.persistKeys) {
        if (
          key in (nextState as Record<string, unknown>) &&
          (nextState as Record<string, unknown>)[key] !==
            (currentState as Record<string, unknown>)[key]
        ) {
          const value = (nextState as Record<string, unknown>)[key];
          initializeDB()
            .then(() => {
              if (db) {
                return setToIndexedDB(db, config.storeName, key, value);
              }
            })
            .catch((err) => {
              console.error(`Ошибка сохранения ${key} в indexedDB:`, err);
            });
        }
      }

      set(partial, replace);
    };

    return stateCreator(setWithPersistence as SetState<T>, get, api);
  };
}
