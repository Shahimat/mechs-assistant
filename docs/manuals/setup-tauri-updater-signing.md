# Setup Tauri Auto-Updater Signing (Phase L2)

Одноразовая настройка Ed25519-ключпары для подписи апдейтов Tauri.
После этого auto-updater начнёт работать: клиент проверяет подпись
`latest.json` перед скачиванием, отбрасывает всё, что не подписано
нашим ключом.

**Кто делает:** владелец репозитория (у которого есть доступ к
`Settings → Secrets` в `Shahimat/mechs-assistant`).

**Когда:** один раз, перед первым push'ем в main после мержа Phase L2.

**Где хранить приватный ключ:** GitHub secret + в надёжном месте у
себя локально (KeePass, iCloud Keychain, что удобнее). Приватный
ключ в git ни в каком виде класть нельзя.

---

## Шаг 1 — сгенерировать ключпару

Локально в терминале мака:

```bash
cd /Users/shahimat/prj/mechs-assistant/apps/cop
npx @tauri-apps/cli signer generate --write-keys ~/tauri-updater-mechs-cop
```

Спросит пароль на приватный ключ — придумай нормальный (длинный),
запиши в KeePass. Этот пароль тоже пойдёт в GitHub secret.

Результат — две файла:

- `~/tauri-updater-mechs-cop` — **приватный** (защищён паролем),
  ни в коем случае не в git.
- `~/tauri-updater-mechs-cop.pub` — **публичный**, идёт в
  `tauri.conf.json`, коммитится в git.

## Шаг 2 — публичный ключ в `tauri.conf.json`

Открой `~/tauri-updater-mechs-cop.pub`, скопируй одной строкой
всё содержимое (что-то вроде
`dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYy...`).

Замени placeholder в
`apps/cop/src-tauri/tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/Shahimat/mechs-assistant/releases/latest/download/latest.json"
    ],
    "pubkey": "ВСТАВЬ_СЮДА_ПУБЛИЧНЫЙ_КЛЮЧ"
  }
}
```

Закоммить в develop, пусть попадёт в main через merge-workflow.

## Шаг 3 — GitHub secrets

`Settings → Secrets and variables → Actions → New repository secret`
для репозитория `Shahimat/mechs-assistant`:

- `TAURI_SIGNING_PRIVATE_KEY` = содержимое файла
  `~/tauri-updater-mechs-cop` целиком (весь base64 внутри, со
  включая заголовок `untrusted comment:` — не подрезай).
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` = пароль, который ты придумал
  в Шаге 1.

Оба secret'а видны только workflow'ам, никому больше — даже
администраторам после сохранения. Если забыл — пересоздать
ключпару, обновить `pubkey` в конфиге, залить новые secrets.

## Шаг 4 — проверка

Push в develop с любой правкой в `apps/cop/**` →
`build-dev` job зелёный, никакой подписи не делает (в dev-flow она
не нужна).

Релиз запускается **строго вручную**: влей develop → main, затем
GitHub → Actions → workflow `build-desktop` → **Run workflow**,
ветка `main`, input `job: release`. Стартует `release` job →
`tauri-action` подписывает, создаёт релиз `Mechs COP v0.1.<N>`,
прикладывает `.msi`, `.msi.zip`, `.msi.zip.sig` и `latest.json`.
(Запуск с `job: release` из ветки не-`main` намеренно skip'ается.)

Проверь в `Releases`:

- Тег вида `mechs-cop-v0.1.<N>`.
- Файлы включают `latest.json` — открой его, там `{"version":
"0.1.N", "platforms": {"windows-x86_64": {"signature": "...",
"url": "..."}}}`.

На запущенном приложении (уже установленной прошлой версии) в
течение нескольких секунд после старта появится баннер «Доступна
новая версия X.Y.Z». Клик «Обновить» → скачивание → рестарт с
новой версией.

## Ротация ключа

Если приватный ключ утёк — надо ротировать:

1. Сгенерируй новую ключпару (Шаг 1) в новый файл, чтобы старый не
   перезаписался — вдруг понадобится подписать критичный revert.
2. Обнови secrets в GitHub (Шаг 3).
3. Обнови `pubkey` в `tauri.conf.json` (Шаг 2).
4. Следующий релиз → приложение НЕ смогут установить пользователи со
   старой версией (их клиент проверяет по старому pubkey, который в
   уже установленном бинаре). Придётся переустановить с нуля из
   Releases вручную. Поэтому ключ храни аккуратно — ротация болезненна.

## Что делать, если ключ **пока** не настроен

Приложение продолжает собираться и работать без updater'а — просто
`check()` в `UpdateBanner` вернёт ошибку/null, баннер не появится.
Дистрибутив через ручное скачивание `.msi` из Actions Artifacts
(30 дней) продолжает работать как раньше.

Настройка Phase L2 — не блокер для остальной работы, можно
разнести по времени с мерджем кода.
