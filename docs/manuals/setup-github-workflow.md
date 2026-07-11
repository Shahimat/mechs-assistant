# Настройка GitHub-репо, Collaborators и workflow-доступа

## Когда использовать

Первичная настройка репозитория. Разделяет три роли:

- **Читатели** — все игроки (5-300), смотрят собранный сайт по URL
  `<username>.github.io/mechs/`.
- **Редакторы данных** — доверенные игроки (5-10 человек), правят
  Google Sheets. Через GitHub не ходят.
- **Триггеры синхронизации** — 2-3 человека с write-доступом к репо,
  нажимают кнопку `Run workflow` в GitHub Actions, когда пора
  подтянуть свежие данные.

Ожидания:

- Уже настроен Google Sheets и Service Account (см.
  `docs/manuals/setup-google-sheets.md`).
- Репозиторий существует (публичный или приватный).

## Что настраиваем

- **Видимость репо** — публичный или приватный (влияет на способ
  деплоя).
- **Collaborators** — список тех, кто может дёргать `workflow_dispatch`.
- **GitHub Pages / Vercel** — куда деплоится собранный сайт.
- **Deploy prefix `/mechs/`** — URL публикуется под этим префиксом.
- **Workflow `sync-and-deploy.yml`** — единая ручка, запускающая
  парсеры и деплой.
- **Concurrency guard** — защита от параллельных запусков workflow.

## Шаги

### 1. Определиться с видимостью репо

- **Публичный.** Проще всего: GitHub Pages работает бесплатно, любой
  может форкнуть код (но не может редактировать без Collaborator
  роли). Данные всё равно защищены — SA-ключ в secrets, редактирование
  Sheets — отдельная плоскость.
- **Приватный.** GitHub Pages требует GitHub Pro (платно) или
  переключиться на Vercel (бесплатно). Данные тоже приватные — что
  логично для скрытого исходника.

Голос по умолчанию — **публичный**. Проще, дешевле, редакторам не
мешает.

### 2. Добавить Collaborators

1. В репозитории: **Settings → Collaborators → Add people**.
2. Введи GitHub username второго разработчика (и любых других
  «триггеров»).
3. Роль — **Write** (даёт право запускать `workflow_dispatch`).
4. Дождись, пока приглашённый примет приглашение (получит e-mail от
   GitHub).

Не давай Collaborator-роль редакторам-игрокам без технического
бэкграунда — им это не нужно. Они правят только Sheets.

### 3. Настроить GitHub Pages (если репо публичный)

1. **Settings → Pages**.
2. **Source: Deploy from a branch**.
3. **Branch: gh-pages** (создастся автоматически при первом деплое
   workflow), **Folder: /** (root).
4. **Save**.
5. Custom domain — оставляем пустым (пока).

URL сайта будет `<username>.github.io/<repo-name>/`. Чтобы получить
целевой URL `<username>.github.io/mechs/`, есть два пути:

- Переименовать репо в `mechs` (**Settings → General → Repository
  name → Rename**).
- Оставить `mechs-assistant`, но выставить `publicPath: '/mechs/'` в
  rspack config и деплоить в поддиректорию `mechs/` внутри branch
  `gh-pages`. Схема сложнее, но не требует переименования.

Голос — **переименовать в `mechs`**. Ясно и лаконично.

### 3-alt. Настроить Vercel (если репо приватный)

1. [vercel.com/new](https://vercel.com/new) → импортировать из GitHub.
2. Выбрать репозиторий.
3. **Framework Preset:** Other (мы вручную запустим `npm run build`).
4. **Build Command:** `npm run build`.
5. **Output Directory:** `dist`.
6. **Environment Variables:** пусто (все секреты уже в GitHub Actions).
7. **Deploy**.

Vercel даст URL вида `mechs-assistant-<hash>.vercel.app`. Кастомный
subpath `/mechs/` настраивается через `publicPath` в rspack.

### 4. Убедиться, что секреты на месте

Проверь в **Settings → Secrets and variables → Actions** наличие:

- `GSHEETS_SA_KEY` — JSON-содержимое Service Account ключа.
- `MECHS_OVERLAY_SPREADSHEET_ID` — ID Google-таблицы.

Если чего-то нет — см. `docs/manuals/setup-google-sheets.md`, шаг 7.

### 5. Создать sync-бота (опционально, для эстетики коммитов)

Workflow будет коммитить от имени бота. Достаточно задать в workflow
`git config user.email` и `git config user.name`:

```yaml
- name: Configure git
  run: |
    git config user.email "sync-bot@users.noreply.github.com"
    git config user.name "mechs-sync-bot"
```

Токен доступа: встроенный `${{ secrets.GITHUB_TOKEN }}` — не надо
создавать отдельный. Он даёт workflow-у право push в текущий репо.

### 6. Workflow `.github/workflows/sync-and-deploy.yml`

Файл появится в фазе feat, набросок для понимания:

```yaml
name: sync-and-deploy
on:
  workflow_dispatch:

concurrency:
  group: sync-and-deploy
  cancel-in-progress: false

jobs:
  sync-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write   # для git push
      pages: write      # для GitHub Pages deploy
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Configure git
        run: |
          git config user.email "sync-bot@users.noreply.github.com"
          git config user.name "mechs-sync-bot"

      - name: Sync from Google Sheets
        env:
          GSHEETS_SA_KEY: ${{ secrets.GSHEETS_SA_KEY }}
          MECHS_OVERLAY_SPREADSHEET_ID: ${{ secrets.MECHS_OVERLAY_SPREADSHEET_ID }}
        run: npm run sync:sheets

      - name: Sync from wiki
        run: npm run sync:wiki

      - name: Commit synced data
        run: |
          git add data/
          git commit -m "sync: data update ($(date -u +%Y-%m-%dT%H:%M:%SZ))" || echo "nothing to commit"
          git push

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
        with:
          artifact_name: github-pages
```

## Проверка

1. Открой репо → **Actions** → в списке слева выбери `sync-and-deploy`.
2. Кнопка **Run workflow** справа. Нажми → **Run workflow**.
3. Дождись прогона (2-3 минуты для пилот-цепочки).
4. Проверь commit-history репо — должен появиться commit от
   `mechs-sync-bot`, если данные изменились.
5. Открой URL сайта — данные должны быть свежими.

## Если что-то пошло не так

- **Workflow не запускается, кнопки нет** — у тебя нет write-доступа
  или workflow ещё не сохранён на main-ветке. Проверь права и что файл
  `.github/workflows/sync-and-deploy.yml` в коммите.
- **`Permission denied` при `git push`** — в `permissions:` пропущено
  `contents: write`. Добавь.
- **Sheets sync упал** — проверь `secrets.GSHEETS_SA_KEY` и
  `MECHS_OVERLAY_SPREADSHEET_ID` в **Settings → Secrets and variables**.
- **GitHub Pages не обновляется** — в **Settings → Pages** убедись,
  что источник — `gh-pages` branch (или что настроено использование
  Actions).
- **Второй разраб не может нажать кнопку** — проверь его роль в
  **Settings → Collaborators**, должно быть Write.

## Отключение

- Отозвать Collaborator у ненужных пользователей.
- Удалить workflow-файл `.github/workflows/sync-and-deploy.yml`.
- Удалить секреты `GSHEETS_SA_KEY`, `MECHS_OVERLAY_SPREADSHEET_ID`.
- В **Settings → Pages** отключить публикацию (Source: None).
