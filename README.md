# mechs-assistant

WEB-ассистент игры Мехи.Земля. Карточный каталог мехов (MVP1) с характеристиками,
ценами, прокачкой, избранным и подсветкой overlay-полей из Google Sheets.
Дальше — расширение на остальные 10 каталогов, калькулятор прокачки, клановый склад,
боевой калькулятор (см. `context/roadmap.md`).

Живой прод: https://shahimat.github.io/mechs-assistant/

## Стек

React 18 + MUI v5 (Emotion styled) + dnd-kit + Zustand + Rspack + TypeScript strict.
Publish: GitHub Actions → GitHub Pages.

## Локальный запуск

```sh
npm install
npm run dev      # dev-сервер на http://localhost:3000
npm run build    # production-сборка в dist/
npm test         # jest
npm run lint     # eslint
```

## Где что лежит

- `src/` — исходники приложения.
- `data/robots.json` — parsed каталог мехов из вики (первичный источник для build-time merger).
- `data/overrides/robots.yml` — overlay из Google Sheets (авто-кэш, не редактируется вручную).
- `data/icons/mechs/` — иконки мехов из вики (webp).
- `assets/raw/` — исходники изображений (png/jpg/svg — «идеи»).
- `assets/images/` — готовые для прода webp (импорт через alias `@img`).
- `scripts/parser-wiki/` — парсер вики `new.mechs.su`.
- `scripts/parser-google-sheets/` — синк overlay из Google Sheets.
- `scripts/build-data/` — build-time merger `data/*.json` + `data/overrides/*.yml` → `.build/`.
- `.build/` — merged JSON, импортируется в стор (gitignored).
- `docs/entities/` — спецификации предметной области.
- `docs/behavior/` — BDD-описание ожидаемого поведения с полем `verified`.
- `docs/manuals/` — процедурные ману́алы (setup Google Sheets, GitHub workflow).
- `context/` — рабочие материалы AI-агента: `project.yml`, `workflow.md`,
  `conventions/`, `views/active.todo`, `roadmap.md`.
- `CLAUDE.md` — точка входа и порядок чтения для AI-агента.

## Документация

Проект живёт по модели трёх слоёв (manual / domain / context) — см.
`CLAUDE.md`. Мануалы для нетривиальных процедур — в `docs/manuals/`
(`setup-google-sheets.md`, `setup-github-workflow.md`, `setup-safety-hooks.md`).
