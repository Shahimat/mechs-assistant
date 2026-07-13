# CLAUDE.md — точка входа для агента

Проект `mechs-assistant`. Ты работаешь по операционному контракту
трёхслойной документации (manual / домен / контекст). Ниже — порядок
чтения и ключевые правила. Не читай весь репозиторий подряд.

## Порядок чтения

1. Этот файл.
2. `context/project.yml` — реквизиты, стек, ключевые константы,
   `contract_source`/`contract_key`.
3. `context/index.yml` — карта репозитория (namespace → id + одна
   строка). Через неё точечно выбираешь релевантные файлы вместо `ls`.
4. `context/modules/*.yml` — manifests подключённых модулей расширения
   (если директория есть). Смотришь `provides`, чтобы понимать, какие
   слои/файлы привнёс модуль. Сейчас в проекте модулей не подключено.
5. `context/workflow.md` — протоколы сценариев (`plan`, `execute`,
   `audit`, `challenge`, `report`, «сверь всё»).
6. Релевантные `context/conventions/*.yml` — по ключам задачи.
7. Релевантные `docs/entities/*.yml` и `docs/behavior/*.yml` — по
   `namespace` задачи (выбранные через индекс).
8. `docs/manuals/*.md` — только для процедурных задач.
9. `context/views/active.todo` — только когда нужен рабочий срез.
10. `context/roadmap.md` — только при обсуждении стратегии, приоритетов
    или MVP-эпиков (какое MVP делаем следующим, зависимости между
    эпиками, риски). Оперативные задачи текущего MVP — в `active.todo`.

`README.md` — для человека. Ты читаешь его по мере необходимости.

`CHANGELOG.md` не входит в дефолтный порядок чтения. Читай по запросу
мотивации решения («почему у нас X, а не Y?»), таймлайна («когда
перешли на Z?») или обзорного среза за последнее время. О «как сейчас»
он не отвечает — состояние читается из `docs/entities/*.yml`,
`docs/behavior/*.yml` и кода. См. convention `changelog`.

## Ключевые правила

- **Чтение перед правкой** — обязательный протокол в
  `context/workflow.md`, секция «Чтение перед правкой». Открыть её до
  первого Edit/Write/меняющего состояние Bash.
- **Язык** — русский для содержательной части (заголовки, описания,
  комментарии, `verified_note`). Английский — только идентификаторы,
  ключи YAML, имена файлов, общеупотребимые термины. См.
  `context/conventions/language.yml`.
- **Верификация** — при семантическом изменении поведения ставь
  `verified: false` на затронутых `docs/behavior/*.yml`. Если можешь
  проверить сразу (`grep`, чтение кода, `npm test`) — проверяй и
  обновляй `verified_at`. См. `context/conventions/verification.yml`.
- **Открытость** — устойчивые уточнения по проекту (договорённости,
  конвенции, поведение) фиксируем в проектной документации репозитория,
  а не в memory / hooks / глобальных настройках инструмента. Команда
  «запомни» = правка проектной доки по умолчанию. См.
  `context/conventions/openness.yml`.
- **Ссылки двусторонние** — если entity указывает behavior, то и
  behavior указывает entity.
- **Атомарные conventions** — одно правило = один файл. Не сваливай в
  общий.
- **Git и изменения истории** — только после явного «да» юзера (глобальное
  правило из `~/.claude/CLAUDE.md`).

## Namespace-ы проекта

- `catalog` — каталоги игровых сущностей, парсеры (wiki + Google Sheets), build-time merger.
- `ui` — карточные view каталогов и общие UI-компоненты.
- `comparison` — избранное (список ключей + drag-and-drop сортировка).
- `persistence` — IndexedDB-персистенция состояния Zustand.

## Точки входа кода

- `src/index.tsx` — bootstrap (React, CssVarsProvider, QueryClientProvider).
- `src/App.tsx` — `<RouterProvider router={router} />`.
- `src/router.tsx` — createBrowserRouter, basename `/mechs-assistant` в prod.
- `src/components/layout/` — AppLayout, AppHeader, Breadcrumbs.
- `src/pages/` — HomePage, CatalogsHubPage, `catalogs/{Mechs,Weapons}CatalogPage`, `CatalogStubPage`.
- `src/components/catalog/` — общие примитивы каталога (Header, Section, Grid, FilterPanel, SearchField, LevelRangeFilter, PairToggleGroup, FavoritesDnDSection, OverlayBadge) + hook'и (`hooks/useSearchFilter`, `useLevelRangeFilter`, `useTypeFilter`, `usePairFilter`).
- `src/components/catalogs/mechs/` — MechsCatalog + RobotCard/RobotDetail/SortableRobotCard.
- `src/components/catalogs/weapons/` — WeaponsCatalog + WeaponCard/WeaponDetail/SortableWeaponCard.
- `src/components/tiles/` — Tile, TileGrid (плитки навигации).
- `src/stores/indexedDBMiddleware.ts` — общий middleware Zustand.
- `src/stores/robots/store.ts` — стор мехов; `src/stores/weapons/store.ts` — стор оружия (отдельные IndexedDB базы).
- `src/utils/overlay.ts` — helpers для `_meta.overlayFields` (принимает любую сущность с `_meta`).
- `src/types/{common,robot,weapon}.ts` — общий Price/OverlayMeta + типы каталогов.
- `data/*.json` (parsed) + `data/overrides/*.yml` (overlay) — источники данных.
- `scripts/catalogs.config.ts` — единый конфиг каталогов (пути, лист Sheets, папки иконок).
- `scripts/build-data/index.ts` — build-time merger (умеет overlay-only записи для новых сущностей).
- `scripts/parser-wiki/` — lib/ (общая инфра) + resolvers/{robots,weapons}.ts + диспетчер index.ts.
- `scripts/parser-google-sheets/index.ts` — синк overlay из Sheets.
- `scripts/setup-sheets-columns/` — идемпотентная настройка колонок листа (columns.ts + index.ts).

## Импорты в src/

- Алиасы: `@/` → `src/`, `@build/` → `.build/`, `@img/` → `assets/images/`, `@raw/` → `assets/raw/`.
- **Относительные импорты `../` в `src/**/*.{ts,tsx}` запрещены** правилом
  `no-restricted-imports` в `.eslintrc.json`. Соседние импорты через `./`
  разрешены. Для сущностей уровня повыше — только через `@/…`.
- Правило не применяется к `scripts/**/*` (там нет alias-инфраструктуры, локальные `../` работают штатно).
