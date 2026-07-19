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
9. `context/views/goals.yaml` + релевантные `context/views/goal--<key>.yaml`
   — рабочий срез и стратегия в одной структуре (очередь целей проекта,
   приоритет = порядок; задачи внутри цели). Читаются в сценариях
   `report` / `execute` / `plan`. Устройство — convention `goals`,
   кросс-целевая непротиворечивость — convention `goal-consistency`.

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
- **Дефолтная ветка для правок — `develop`**. В `main` вливается только
  через PR (ruleset защищает от прямых push'ей коллабораторов;
  admin-автор технически может, но по договорённости не делает).
  Подробности — `context/workflow.md`, секция «Git-процесс проекта
  (ветки, ручки, защита main)».

## Структура монорепо

npm workspaces `["apps/*", "packages/*"]`, единый корневой
`package-lock.json`, `npm ci` из корня ставит все воркспейсы.

- `apps/web/` — публичный WEB-справочник (SPA, rspack, dev-порт 3000).
  Здесь живут все namespace-ы каталогов (см. ниже).
- `apps/cop/` — десктоп-клиент клана (Tauri, COP; dev-порт 1420). Rust —
  `apps/cop/src-tauri/`, phash-индекс — `apps/cop/src/generated/`.
- `packages/shared/` — скаффолд общего слоя (`@mechs/shared`).
- `scripts/`, `data/`, `assets/raw/` — общие, остаются в **корне** репо
  (единый вход data-pipeline; не переезжали в apps/).

## Namespace-ы проекта

`apps/web` (SPA-справочник):

- `catalog` — каталоги игровых сущностей, парсеры (wiki + Google Sheets), build-time merger.
- `ui` — карточные view каталогов и общие UI-компоненты.
- `comparison` — избранное (список ключей + drag-and-drop сортировка).
- `persistence` — IndexedDB-персистенция состояния Zustand.

`apps/cop` (Tauri-клиент клана):

- `cop` — десктоп-клиент: Rust-мост (xcap/imageproc), pipeline распознавания
  инвентаря (pHash + OCR), UI парсера, auto-updater. Стек намеренно отличается
  от web (plain React + CSS, без MUI/Zustand/router) — см. convention `cop-stack`.

## Точки входа кода

SPA — под `apps/web/src/`:

- `apps/web/src/index.tsx` — bootstrap (React 19, ThemeProvider MUI v7, QueryClientProvider).
- `apps/web/src/App.tsx` — `<RouterProvider router={router} />`.
- `apps/web/src/router.tsx` — createBrowserRouter, basename `/mechs-assistant` в prod, 16 роутов каталогов.
- `apps/web/src/components/layout/` — AppLayout, AppHeader, Breadcrumbs.
- `apps/web/src/pages/` — HomePage, CatalogsHubPage, `catalogs/*CatalogPage.tsx` (16 тонких обёрток, по одной на каталог).
- `apps/web/src/components/catalog/` — общие примитивы каталога:
  - Compositional: Header, Section, Grid, FilterPanel, SearchField, LevelRangeFilter, PairToggleGroup, FavoritesDnDSection, OverlayBadge.
  - Cross-catalog: `IngredientMiniCard` (иконка+×N+tooltip+клик-навигация, count опционален), `BlueprintChipList` (мини-карточки чертежей для секции «Крафт»).
  - Hook'и: `useSearchFilter`, `useLevelRangeFilter`, `useTypeFilter`, `usePairFilter`, `useDeepLinkOpen` (URL ?open=<key> для открытия Detail с историей браузера).
- `apps/web/src/components/catalogs/<slug>/` — карточные view + Card/Detail/SortableCard для каждого каталога (mechs/weapons/ammo/items/ore/loot/components/skills/blueprints + equipment общий + 7 тонких обёрток chips/shields/armour/accumulators/reactors/drills/cargos).
- `apps/web/src/components/tiles/` — Tile, TileGrid (плитки навигации).
- `apps/web/src/stores/indexedDBMiddleware.ts` — общий middleware Zustand.
- `apps/web/src/stores/<slug>/store.ts` — 10 сторов (robots, weapons, equipment, ammo, items, ore, loot, components, skills, blueprints); каждый на отдельной IndexedDB базе.
- `apps/web/src/utils/overlay.ts` — helpers для `_meta.overlayFields` (принимает любую сущность с `_meta`).
- `apps/web/src/utils/crossCatalogLookup.ts` — единый lookup name/iconPath/subtype по (catalog, key) + `lookupBlueprintKeyByName(name)` для секции «Крафт».
- `apps/web/src/utils/catalogPath.ts` — `catalogPathFor(catalog, key)` → URL `/catalogs/<slug>-catalog?open=<key>`; equipment → resolve subtype в 7 UI-подкаталогов.
- `apps/web/src/utils/icons.ts` — `resolveIconUrl(iconPath)` для сборки URL иконки.
- `apps/web/src/types/{common,robot,weapon,equipment,ammo,item,ore,loot,component,skill,blueprint}.ts` — Price/OverlayMeta/Transform + типы каталогов.

Общие (корень репо):

- `data/*.json` (parsed) + `data/overrides/*.yml` (overlay) — источники данных.
- `assets/raw/blueprint.png` — фон-«планшет» для композита иконок чертежей.
- `scripts/catalogs.config.ts` — единый конфиг каталогов (пути, лист Sheets, папки иконок, опциональный `iconBackgroundPath`).
- `scripts/build-data/index.ts` — build-time merger: overlay-merge + двухпроходной cross-catalog resolve `catalog` в blueprints.ingredients / producesCatalog / transformsFrom.ingredients.
- `scripts/parser-wiki/` — lib/ (общая инфра, включая `composeWithBackground` для наложения продукта на background) + resolvers/*.ts (10 резолверов) + диспетчер index.ts.
- `scripts/parser-google-sheets/index.ts` — синк overlay из Sheets.
- `scripts/setup-sheets-columns/` — идемпотентная настройка колонок 10 листов (columns.ts + index.ts).

## Импорты в apps/web/src/

- Алиасы (SPA): `@/` → `apps/web/src/`, `@build/` → корневой `.build/`, `@img/` → `apps/web/assets/images/`, `@raw/` → корневой `assets/raw/`. Конфиг — `apps/web/rspack.config.js` (`resolve.alias`) + `apps/web/tsconfig.json` (`paths`).
- **Относительные импорты `../` в `apps/web/src/**/*.{ts,tsx}` запрещены** правилом
  `no-restricted-imports` в `eslint.config.js`. Соседние импорты через `./`
  разрешены. Для сущностей уровня повыше — только через `@/…`.
- Правило не применяется к `scripts/**/*` (там нет alias-инфраструктуры, локальные `../` работают штатно).
