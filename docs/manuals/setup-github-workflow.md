# Настройка GitHub-репо, Collaborators и workflow-доступа

## Когда использовать

Первичная настройка репозитория. Разделяет три роли:

- **Читатели** — все игроки (5-300), смотрят собранный сайт по URL
  `<username>.github.io/mechs/`.
- **Редакторы данных** — доверенные игроки (5-10 человек), правят
  Google Sheets. Через GitHub не ходят.
- **Триггеры синхронизации** — 2-3 человека с write-доступом к репо,
  нажимают кнопки `Run workflow` в GitHub Actions, когда пора
  подтянуть свежие данные.

Ожидания:

- Уже настроен Google Sheets и Service Account (см.
  `docs/manuals/setup-google-sheets.md`).
- Репозиторий существует (публичный или приватный).

## Что настраиваем

- **Видимость репо** — публичный или приватный (влияет на способ деплоя).
- **Collaborators** — список тех, кто может дёргать `workflow_dispatch`.
- **GitHub Pages / Vercel** — куда деплоится собранный сайт.
- **Deploy prefix `/mechs/`** — URL публикуется под этим префиксом.
- **Три workflow** с разной моделью запуска под разный риск:
  - `sync-wiki.yml` — редко, через **Pull Request** (парсинг вики
    нестабилен, нужен review diff перед merge).
  - `sync-sheets.yml` — часто, **прямой push в main** (стабильный
    Google API, точечные overlay-фиксы, редакторам не надо ждать
    review).
  - `deploy.yml` — **автомат по push в `main`** + возможность повторить
    вручную через `workflow_dispatch`.
- **Concurrency guard** — защита от параллельных запусков `deploy`.

## Шаги

### 1. Определиться с видимостью репо

- **Публичный.** Проще всего: GitHub Pages работает бесплатно, любой
  может форкнуть код (но не может редактировать без Collaborator роли).
  Данные защищены — SA-ключ в secrets, редактирование Sheets — отдельная
  плоскость.
- **Приватный.** GitHub Pages требует GitHub Pro (платно) или
  переключиться на Vercel (бесплатно).

Голос по умолчанию — **публичный**.

### 2. Добавить Collaborators

1. В репозитории: **Settings → Collaborators → Add people**.
2. Введи GitHub username второго разработчика (и любых других
   «триггеров»).
3. Роль — **Write** (даёт право запускать `workflow_dispatch` и мержить
   PR).
4. Дождись, пока приглашённый примет приглашение.

Не давай Collaborator-роль редакторам-игрокам без технического
бэкграунда — они правят только Sheets.

### 3. Настроить GitHub Pages (если репо публичный)

1. **Settings → Pages**.
2. **Source: GitHub Actions** (не «Deploy from a branch»). Это
   современный подход — деплой идёт через workflow напрямую, никакая
   `gh-pages` ветка не нужна.
3. Настройка активна сразу, сохранять ничего не надо.

URL сайта будет `<username>.github.io/<repo-name>/`. Чтобы получить
целевой `<username>.github.io/mechs/`:

- **Переименовать репо в `mechs`** — рекомендуемый вариант. **Settings
  → General → Repository name → Rename**.
- Оставить `mechs-assistant` и деплоить в поддиректорию `mechs/` через
  rspack `output.publicPath` — сложнее, требует ручного redirect.

### 3-alt. Настроить Vercel (если репо приватный)

1. [vercel.com/new](https://vercel.com/new) → импортировать из GitHub.
2. **Framework Preset:** Other.
3. **Build Command:** `npm run build`.
4. **Output Directory:** `dist`.
5. **Deploy**.

`publicPath: '/mechs/'` настраивается в rspack config.

### 4. Убедиться, что секреты на месте

Проверь в **Settings → Secrets and variables → Actions** наличие:

- `GSHEETS_SA_KEY` — JSON-содержимое Service Account ключа.
- `MECHS_OVERLAY_SPREADSHEET_ID` — ID Google-таблицы.

Если чего-то нет — см. `docs/manuals/setup-google-sheets.md`, шаг 7.

### 5. Настроить sync-бота

Все три workflow коммитят от имени бота через встроенный
`${{ secrets.GITHUB_TOKEN }}`. Отдельно ничего создавать не надо.
В workflow-шагах — `git config`:

```yaml
- name: Configure git
  run: |
    git config user.email "sync-bot@users.noreply.github.com"
    git config user.name "mechs-sync-bot"
```

### 6. Workflow-файлы

Файлы появятся в фазе feat. Ниже эскизы для понимания.

#### 6a. `.github/workflows/sync-wiki.yml`

Тянет вики, коммитит в **новую branch и создаёт Pull Request** (не
прямой push в main). Ты (или второй разраб) смотришь diff, мержишь
если ок.

```yaml
name: sync-wiki
on:
  workflow_dispatch:

jobs:
  sync-wiki:
    runs-on: ubuntu-latest
    permissions:
      contents: write # для создания branch
      pull-requests: write # для открытия PR
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

      - name: Sync wiki
        run: npm run sync:wiki

      - name: Create PR
        uses: peter-evans/create-pull-request@v6
        with:
          branch: sync/wiki-${{ github.run_number }}
          title: 'sync: wiki data update'
          body: |
            Автоматический sync из вики `new.mechs.su`.

            Проверить diff по `data/robots.json`, `data/icons/mechs/`.
            Сверить количество мехов с калькулятором:
            `curl -sSL https://new.mechs.su/cms/wp-content/uploads/mechsearth/calc/mechs.txt | wc -l`
          commit-message: 'sync: wiki data update'
          add-paths: |
            data/
```

#### 6b. `.github/workflows/sync-sheets.yml`

Тянет Sheets, коммитит **прямо в main**.

```yaml
name: sync-sheets
on:
  workflow_dispatch:

concurrency:
  group: sync-sheets
  cancel-in-progress: false

jobs:
  sync-sheets:
    runs-on: ubuntu-latest
    permissions:
      contents: write
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

      - name: Sync sheets
        env:
          GSHEETS_SA_KEY: ${{ secrets.GSHEETS_SA_KEY }}
          MECHS_OVERLAY_SPREADSHEET_ID: ${{ secrets.MECHS_OVERLAY_SPREADSHEET_ID }}
        run: npm run sync:sheets

      - name: Commit overrides
        run: |
          git add data/overrides/
          git commit -m "sync: overrides from Google Sheets ($(date -u +%Y-%m-%dT%H:%M:%SZ))" || echo "nothing to commit"
          git push
```

#### 6c. `.github/workflows/deploy.yml`

Автомат по push в `main` + возможность повторить вручную. Собирает
bundle и деплоит на GitHub Pages.

```yaml
name: deploy
on:
  push:
    branches: [main]
    paths:
      - 'data/**'
      - 'src/**'
      - 'package.json'
      - 'package-lock.json'
      - 'rspack.config.*'
      - 'tsconfig.json'
  workflow_dispatch:

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Проверка

### Sync wiki (через PR)

1. **Actions → sync-wiki → Run workflow**.
2. Дождись прогона (2-3 минуты).
3. Открой **Pull requests** — должен появиться PR от бота.
4. Просмотри diff `data/robots.json`, `data/icons/mechs/`.
5. Убедись что количество мехов близко к калькулятору
   (`curl -sSL https://new.mechs.su/cms/wp-content/uploads/mechsearth/calc/mechs.txt | wc -l`).
6. Если ок — merge PR. `deploy` запустится автоматически.
7. Если сломано — закрой PR без merge, разберись с парсером.

### Sync sheets (прямой push)

1. **Actions → sync-sheets → Run workflow**.
2. Проверь commit-history — новый commit от `mechs-sync-bot` в
   `data/overrides/*.yml`.
3. `deploy` запустится автоматически по push.

### Deploy (автомат)

1. Триггерится любым push в `main` с изменениями в `data/`, `src/`,
   `package.json`, `rspack.config.*`, `tsconfig.json`.
2. Ручной запуск: **Actions → deploy → Run workflow**.
3. Проверь URL сайта — данные должны быть свежими.

## Если что-то пошло не так

- **Workflow не запускается, кнопки нет** — у тебя нет write-доступа
  или workflow ещё не сохранён на main-ветке.
- **`Permission denied` при `git push`** — в `permissions:` пропущено
  `contents: write`. Добавь.
- **Sheets sync упал** — проверь `secrets.GSHEETS_SA_KEY` и
  `MECHS_OVERLAY_SPREADSHEET_ID` в **Settings → Secrets**.
- **Wiki sync выдал слишком мало мехов** — сверься с калькулятором
  `mechs.txt` (см. выше), возможно вика поменяла разметку. Не мерж, чини
  парсер.
- **GitHub Pages не обновляется** — в **Settings → Pages** источник
  должен быть **GitHub Actions**, не «Deploy from a branch».
- **Второй разраб не может нажать кнопку** — проверь его роль в
  **Settings → Collaborators**, должно быть Write.

## Отключение

- Отозвать Collaborator у ненужных пользователей.
- Удалить workflow-файлы `.github/workflows/*.yml`.
- Удалить секреты `GSHEETS_SA_KEY`, `MECHS_OVERLAY_SPREADSHEET_ID`.
- В **Settings → Pages** отключить публикацию (Source: None).
