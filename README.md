# mechs-assistant

WEB-ассистент игры Мехи.Земля. Сравнительная таблица роботов: характеристики,
цены, прокачка, избранное и «базовый робот» для попарного сравнения.

## Стек

React 18 + MUI v5 (Emotion) + Zustand + AG Grid Community v35 + Rspack + TypeScript strict.

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
- `data/robots.json` — обработанный каталог роботов, источник для UI.
- `raw-data/` — сырые HTML-выгрузки со страниц вики (gitignored, из них
  получен `data/robots.json`).
- `docs/entities/` — спецификации предметной области.
- `docs/behavior/` — BDD-описание ожидаемого поведения с полем `verified`.
- `context/` — рабочие материалы AI-агента: `project.yml`, `workflow.md`,
  `conventions/`, `views/active.todo`.
- `CLAUDE.md` — точка входа и порядок чтения для AI-агента.

## Документация

Проект живёт по модели трёх слоёв (manual / domain / context) — см.
`CLAUDE.md`. Мануалов пока нет: команды из этого файла + `package.json`
покрывают процедурные задачи.
