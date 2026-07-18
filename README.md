# mechs-assistant

Ассистент игры Мехи.Земля — монорепо (npm workspaces). `apps/web` — публичный
WEB-справочник: карточные каталоги с характеристиками, ценами, прокачкой,
избранным и подсветкой overlay-полей из Google Sheets. `apps/cop` — десктоп-клиент
клана (Tauri, COP). Дальше — калькулятор прокачки, клановый склад, боевой
калькулятор (см. `context/views/goals.yaml`).

Живой прод (apps/web): https://shahimat.github.io/mechs-assistant/

## Стек

React 19 + MUI v7 (Emotion styled) + dnd-kit + Zustand + Rspack + TypeScript strict.
Десктоп — Tauri 2.x. Publish: GitHub Actions → GitHub Pages (apps/web),
Releases (apps/cop).

## Локальный запуск

Монорепо на npm workspaces; `npm install` из корня ставит все воркспейсы.

```sh
npm install
npm run dev      # dev-сервер apps/web на http://localhost:3000
npm run build    # production-сборка apps/web в apps/web/dist/
npm test         # jest
npm run lint     # eslint
```

## Где что лежит

- `apps/web/src/` — исходники WEB-справочника (SPA).
- `apps/cop/` — десктоп-клиент клана (Tauri, COP; Rust — `apps/cop/src-tauri/`).
- `packages/shared/` — скаффолд общего слоя (`@mechs/shared`).
- `data/robots.json` — parsed каталог мехов из вики (первичный источник для build-time merger).
- `data/overrides/robots.yml` — overlay из Google Sheets (авто-кэш, не редактируется вручную).
- `data/icons/mechs/` — иконки мехов из вики (webp).
- `assets/raw/` — исходники изображений (png/jpg/svg — «идеи»; корень репо, alias `@raw`).
- `apps/web/assets/images/` — готовые для прода webp (импорт через alias `@img`).
- `scripts/parser-wiki/` — парсер вики `new.mechs.su`.
- `scripts/parser-google-sheets/` — синк overlay из Google Sheets.
- `scripts/build-data/` — build-time merger `data/*.json` + `data/overrides/*.yml` → `.build/`.
- `.build/` — merged JSON, импортируется в стор (gitignored).
- `docs/entities/` — спецификации предметной области.
- `docs/behavior/` — BDD-описание ожидаемого поведения с полем `verified`.
- `docs/manuals/` — процедурные ману́алы (setup Google Sheets, GitHub workflow).
- `context/` — рабочие материалы AI-агента: `project.yml`, `workflow.md`,
  `conventions/`, `views/goals.yaml` + `views/goal--<key>.yaml`.
- `CLAUDE.md` — точка входа и порядок чтения для AI-агента.

## Документация

Проект живёт по модели трёх слоёв (manual / domain / context) — см.
`CLAUDE.md`. Мануалы для нетривиальных процедур — в `docs/manuals/`
(`setup-google-sheets.md`, `setup-github-workflow.md`, `setup-safety-hooks.md`).
