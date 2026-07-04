# CLAUDE.md — точка входа для агента

Проект `mechs-assistant`. Ты работаешь по операционному контракту
трёхслойной документации (manual / домен / контекст). Ниже — порядок
чтения и ключевые правила. Не читай весь репозиторий подряд.

## Порядок чтения

1. Этот файл.
2. `context/project.yml` — реквизиты, стек, ключевые константы.
3. `context/workflow.md` — протоколы сценариев (`plan`, `execute`, `audit`,
   `challenge`, `report`).
4. Релевантные `context/conventions/*.yml` — по ключам задачи.
5. Релевантные `docs/entities/*.yml` и `docs/behavior/*.yml` — по
   `namespace` задачи.
6. `context/views/active.todo` — только когда нужен рабочий срез.

`README.md` — для человека. Ты читаешь его по мере необходимости.

## Ключевые правила

- **Язык** — русский для содержательной части (заголовки, описания,
  комментарии, `verified_note`). Английский — только идентификаторы,
  ключи YAML, имена файлов, общеупотребимые термины. См.
  `context/conventions/language.yml`.
- **Верификация** — при изменении кода ставь `verified: false` на
  затронутых `docs/behavior/*.yml`. Если можешь проверить сразу (`grep`,
  чтение кода, `npm test`) — проверяй и обновляй `verified_at`. См.
  `context/conventions/verification.yml`.
- **Ссылки двусторонние** — если entity указывает behavior, то и
  behavior указывает entity.
- **Атомарные conventions** — одно правило = один файл. Не сваливай в
  общий.
- **Git и изменения истории** — только после явного «да» юзера (глобальное
  правило из `~/.claude/CLAUDE.md`).

## Namespace-ы проекта

- `catalog` — каталог роботов, источники данных.
- `ui` — компоненты интерфейса, таблица.
- `comparison` — избранное и «базовый робот».
- `persistence` — IndexedDB-персистенция состояния Zustand.

## Точки входа кода

- `src/index.tsx` — bootstrap (React, ThemeProvider, QueryClientProvider).
- `src/App.tsx` — рендерит `RobotsGrid`.
- `src/components/RobotsGrid.tsx` — таблица AG Grid.
- `src/stores/robots/store.ts` — Zustand-стор роботов.
- `src/stores/robots/indexedDBMiddleware.ts` — middleware персистенции.
- `data/robots.json` — источник данных.
