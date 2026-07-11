# Журнал решений

Формат: «когда» и «почему». Текущее состояние — в `docs/entities/*.yml`,
`docs/behavior/*.yml` и коде.

- 2026-07-11 · хранилище данных — прямо в основном репо (вариант α), без S3/Synology; парсеры коммитят `data/*.json` + `data/icons/` + `data/overrides/*.yml`; deploy на GitHub Pages под префиксом `/mechs/`; workflow `sync-and-deploy` с ручным `workflow_dispatch`, доступ через Collaborators; заведены manuals `setup-google-sheets` и `setup-github-workflow` · S3/MinIO избыточны для нашего масштаба (10-50 MB), git даёт бесплатное версионирование и PR-review при синке
- 2026-07-11 · три ручки GitHub Actions вместо одной — `sync-wiki` открывает PR (парсинг вики нестабилен, нужен review), `sync-sheets` пушит в main (стабильно), `deploy` автомат по push в main; source калькулятора `mechs.txt` фиксирован как sanity-check при review sync-wiki PR · разный риск процессов требует разной модели контроля
- 2026-07-10 · overlay-источник переведён на Google Sheets — доступно для всех 11 каталогов; `parser--google-sheets` синк в data/overrides/*.yml; merged JSON несёт `_meta.overlayFields/overlayUpdatedAt/overlaySource` для UI-подсветки уточнённых полей; контекстные вариации (заводы v2/v3, лут по локациям) отложены до MVP2/MVP4 · игроки-редакторы могут вносить уточнения в знакомой среде, не только автор
- 2026-07-10 · MVP1 расширен до полного справочного слоя — 11 data-сущностей (мехи, weapons, equipment, ammo, items, loot, blueprints, ore, components, currencies, skills), универсальный `parser--wiki`, гибрид парсер+overlay для loot/components, convention `data-overlay` · «каталог мехов» был слишком узкой формулировкой; калькулятору и складу нужен полный слой
- 2026-07-10 · эпик «Данные»: Вариант B — build-time bundle данных из S3-совместимого self-hosted Synology · разделение приватного архива и публичных данных, детали настройки — отдельной фазой перед парсером
- 2026-07-10 · визуал MVP1-3 — на MUI defaults без выделенной дизайн-фазы; возврат к дизайну в MVP4 (radar/spec-sheet) · юзер валидировал результат feat #1, лишний цикл не нужен
- 2026-07-10 · спецификация переведена на MVP1 — снос `robots-grid` и `base-robot-comparison`, ввод `view--robots-catalog`, convention `entity-naming` (префиксы view/data/parser/other) · открываем реализацию карточного каталога как замены таблице
- 2026-07-10 · заведён `context/roadmap.md` со стратегией MVP1-4 + сквозными эпиками, зафиксированы аудитория/позиционирование и внешние источники в `project.yml` · оформили общее видение до старта первого MVP
- 2026-07-09 · синхронизация с контрактом v2 (6f002e3a) — добавлен blocking-question, active.todo переведён на приоритеты · выравниваем правду с обновлённым upstream
- 2026-07-05 · синхронизация с operational contract v2 · подхват CHANGELOG.md, механизма модулей расширения, sync-архитектуры через prompts/index.yml + SHA-checkpoint, curl-only fetch, страховочного hook блокировки записи в memory
