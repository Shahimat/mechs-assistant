# Настройка Google Sheets как источника overlay

## Когда использовать

Первичная настройка окружения для нового проекта или после клонирования
на новую машину. Даёт `parser--google-sheets` доступ к таблице через
Service Account.

Ожидания:

- У автора уже создана Google-таблица (по одному листу на каталог).
- У автора есть аккаунт Google Cloud (бесплатный).
- SA-ключ хранится вне репо; в CI — в `secrets.GSHEETS_SA_KEY`.

## Что настраиваем

- **Google Cloud проект** — контейнер для API-ресурсов.
- **Sheets API** — включённый API v4 в проекте.
- **Service Account** — «робот-пользователь» без пароля, с JSON-ключом.
- **Доступ таблицы** — email SA добавлен как Editor в Sheets.
- **Локальный путь к ключу** — переменная окружения
  `GSHEETS_SA_KEY_PATH` для локального запуска парсера.
- **GitHub Secret** — содержимое ключа в `secrets.GSHEETS_SA_KEY` для
  workflow `sync-and-deploy.yml`.

## Шаги

### 1. Создать Google Cloud проект

1. Открой [console.cloud.google.com](https://console.cloud.google.com).
2. В верхней панели нажми на селектор проекта → **New Project**.
3. Название: `mechs-assistant` (или любое узнаваемое). Organization —
   без организации, если у тебя нет корпоративного аккаунта.
4. Дождись создания проекта (30 секунд).

### 2. Включить Google Sheets API

1. В консоли нажми на бургер-меню → **APIs & Services → Library**.
2. Найди «Google Sheets API».
3. Нажми **Enable**.

### 3. Создать Service Account

1. В консоли: **APIs & Services → Credentials**.
2. **Create Credentials → Service Account**.
3. Название: `mechs-sheets-sync`. ID сгенерируется автоматически, вида
   `mechs-sheets-sync@<project-id>.iam.gserviceaccount.com` — запиши
   его, будет нужен на шаге 5.
4. Роли (Roles) — можно пропустить (пусто), для читалки листов не
   нужны IAM-роли, доступ выдаётся отдельно через Sheets share.
5. **Done**.

### 4. Скачать JSON-ключ

1. В списке Service Accounts кликни на созданный `mechs-sheets-sync`.
2. Вкладка **Keys** → **Add Key** → **Create new key** → **JSON** →
   **Create**.
3. Браузер скачает файл вида
   `<project-id>-<hash>.json`. Это твой ключ.

### 5. Дать Service Account доступ к таблице

1. Открой Google-таблицу проекта.
2. Правый верхний угол → **Share** (Настроить доступ).
3. В поле «Добавить пользователей» вставь email из шага 3:
   `mechs-sheets-sync@<project-id>.iam.gserviceaccount.com`.
4. Роль — **Editor** (Редактор). SA будет только читать, но Editor
   даёт запас на случай, если в будущем захотим двусторонний синк.
5. **Notify people** — сними галку (SA не получит письмо, оно ему не
   нужно).
6. **Share**.

### 6. Положить ключ вне репо (локально)

Пример пути: `~/.config/mechs-assistant/gsheets-sa.json`.

```bash
mkdir -p ~/.config/mechs-assistant
mv ~/Downloads/<project-id>-<hash>.json ~/.config/mechs-assistant/gsheets-sa.json
chmod 600 ~/.config/mechs-assistant/gsheets-sa.json
```

Экспортируй путь как переменную окружения (в `~/.zshrc` или
`~/.bashrc`):

```bash
export GSHEETS_SA_KEY_PATH="$HOME/.config/mechs-assistant/gsheets-sa.json"
```

Также запиши ID Google-таблицы (кусок URL между `/d/` и `/edit`) в
переменную:

```bash
export MECHS_OVERLAY_SPREADSHEET_ID="<paste-your-google-sheet-id-here>"
```

Перезагрузи shell: `source ~/.zshrc`.

**Альтернатива — файл `.env.local`.** Если работа в разных терминалах
и rc-файл неудобен, скопируй `.env.local.example` → `.env.local` в
корне репозитория и заполни значения. `.env.local` уже в `.gitignore`,
скрипты подхватывают его автоматически через `dotenv`.

### 7. Положить ключ в GitHub Secrets

1. В GitHub-репозитории: **Settings → Secrets and variables → Actions**.
2. **New repository secret**.
3. Name: `GSHEETS_SA_KEY`. Value: полное содержимое JSON-файла
   (открой в текстовом редакторе, скопируй все).
4. **Add secret**.
5. Ещё один secret: `MECHS_OVERLAY_SPREADSHEET_ID`, значение — тот же
   ID таблицы.

## Проверка

Смок-тест локально (после того как появится сам `parser--google-sheets`
в фазе feat):

```bash
npm run sync:sheets
```

Ожидание:

- Скрипт читает лист `mechs` из таблицы.
- Пишет `data/overrides/mechs.yml` в репо.
- Ничего не ломает в других файлах.
- Если ключ не найден или доступа нет — сообщает понятной ошибкой.

## Если что-то пошло не так

- **`Error: The caller does not have permission`** — SA нет в share
  таблицы, повтори шаг 5.
- **`Error: API has not been used ... or is disabled`** — забыт шаг 2,
  включи Sheets API.
- **Локальный запуск ругается на путь к ключу** — проверь, что
  `echo $GSHEETS_SA_KEY_PATH` показывает существующий файл и что
  `chmod 600` не сломало чтение (владелец файла — ты).

## Отключение

- Удалить Service Account из **Credentials** в Google Cloud (снимет
  доступ мгновенно).
- Удалить JSON-ключ локально: `rm ~/.config/mechs-assistant/gsheets-sa.json`.
- Удалить GitHub Secrets `GSHEETS_SA_KEY` и `MECHS_OVERLAY_SPREADSHEET_ID`.
- В самой таблице снять email SA из share (опционально — SA уже
  удалён, доступ уже не работает).
