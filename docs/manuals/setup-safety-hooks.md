# Настройка страховочных hooks Claude Code

## Когда использовать

Первичная настройка окружения разработчика для этого проекта (или после
клонирования на новую машину). Hooks — дополнительная страховка к
правилам, публично записанным в `context/conventions/openness.yml`. Без
hooks проект работает, но правило открытости держится только на
дисциплине агента.

## Что настраиваем

Один hook на `PreToolUse` инструмента `Write`:
`~/.claude/hooks/block-memory-write-for-agent-operational-contract-v2.sh`.
Блокирует запись в `~/.claude/projects/*/memory/*` для проектов, в
`context/project.yml` которых `sync.contract.key ==
agent-operational-contract-v2`.

Имя суффикса hook = `contract-key`. Логика внутри сама выделяет суффикс
из `$0` и сверяет с прочитанным `sync.contract.key`. Один hook — один
контракт. Для параллельных проектов на других контрактах — отдельный
файл с соответствующим именем.

## Шаги

1. Убедись, что установлен `jq` (`brew install jq`) — нужен для парсинга
   JSON-payload от Claude Code.
2. Убедись, что установлен `yq` (`brew install yq`) — нужен для чтения
   вложенных полей из YAML (`sync.contract.key`). Если `yq` нет, hook
   пытается упасть обратно на `awk`-парсинг, но это менее надёжно.
3. Создай (или обнови) файл
   `~/.claude/hooks/block-memory-write-for-agent-operational-contract-v2.sh`
   по шаблону из шага 4.
4. Содержимое скрипта:

   ```bash
   #!/bin/bash
   # PreToolUse hook. Блокирует Write в ~/.claude/projects/*/memory/*,
   # когда CWD-проект подписан на operational contract v2.
   # Логика: суффикс имени файла (после "block-memory-write-for-") = ключ
   # контракта; сверяем с sync.contract.key из context/project.yml
   # текущего CWD. Совпало → deny. Не совпало / файла нет → тихо пропуск.
   set -u

   PAYLOAD=$(cat)

   TOOL_NAME=$(printf '%s' "$PAYLOAD" | jq -r '.tool_name // empty')
   [ "$TOOL_NAME" = "Write" ] || exit 0

   FILE_PATH=$(printf '%s' "$PAYLOAD" | jq -r '.tool_input.file_path // empty')
   [ -n "$FILE_PATH" ] || exit 0

   CWD=$(printf '%s' "$PAYLOAD" | jq -r '.cwd // empty')
   [ -n "$CWD" ] || exit 0

   case "$FILE_PATH" in
     "$HOME/.claude/projects/"*"/memory/"*) ;;
     *) exit 0 ;;
   esac

   PROJECT_YML="$CWD/context/project.yml"
   [ -f "$PROJECT_YML" ] || exit 0

   SELF_NAME=$(basename "$0" .sh)
   EXPECTED_KEY="${SELF_NAME#block-memory-write-for-}"
   [ -n "$EXPECTED_KEY" ] || exit 0
   [ "$EXPECTED_KEY" != "$SELF_NAME" ] || exit 0

   if command -v yq >/dev/null 2>&1; then
     ACTUAL_KEY=$(yq -r '.sync.contract.key // ""' "$PROJECT_YML" 2>/dev/null)
   else
     ACTUAL_KEY=$(awk '
       /^sync:/ { in_sync=1; next }
       in_sync && /^[^[:space:]]/ { in_sync=0 }
       in_sync && /^[[:space:]]+contract:/ { in_contract=1; next }
       in_contract && /^[[:space:]]{0,2}[^[:space:]]/ { in_contract=0 }
       in_contract && /^[[:space:]]+key:/ {
         sub(/^[[:space:]]+key:[[:space:]]*/, "")
         gsub(/["'\''[:space:]]/, "")
         print
         exit
       }
     ' "$PROJECT_YML")
   fi

   [ "$ACTUAL_KEY" = "$EXPECTED_KEY" ] || exit 0

   REASON="STOP. Проект работает по контракту ${EXPECTED_KEY}. Его convention openness требует записывать устойчивые проектные факты (правила, конвенции, процедуры, договорённости, крупные решения) в repo-документацию: docs/entities/, docs/behavior/, docs/manuals/, context/conventions/, context/project.yml, CHANGELOG.md. Приватная память Claude (~/.claude/projects/*/memory/) — не место для проектных фактов.

   Прежде чем повторить действие, определись:
     - Устойчивый проектный факт → пиши в repo-слой с явного «да» юзера.
     - Персональный / эфемерный контекст (роль юзера, ссылка на внешнюю систему, мета про сессию) → приватная память допустима. Тогда осознанно сообщи юзеру о принятом решении и повтори Write."

   jq -n --arg reason "$REASON" '{
     hookSpecificOutput: {
       hookEventName: "PreToolUse",
       permissionDecision: "deny",
       permissionDecisionReason: $reason
     }
   }'
   ```

5. Сделай скрипт исполняемым:

   ```bash
   chmod +x ~/.claude/hooks/block-memory-write-for-agent-operational-contract-v2.sh
   ```

6. Зарегистрируй hook в `~/.claude/settings.json`. В блоке `hooks` →
   `PreToolUse` добавь запись с `matcher: "Write"` и командой на путь к
   скрипту. Если запись с таким же `matcher` уже есть — добавь новый
   объект в её массив `hooks`, не переписывай существующий.

   Целевой фрагмент:

   ```json
   {
     "matcher": "Write",
     "hooks": [
       {
         "type": "command",
         "command": "/Users/<you>/.claude/hooks/block-memory-write-for-agent-operational-contract-v2.sh"
       }
     ]
   }
   ```

7. Если раньше был hook по старому имени (`block-memory-write-for-contract-v2.sh`
   или иное) — удали и файл, и его регистрацию из `settings.json`.
   Спецификация контракта требует полный `contract-key` в суффиксе.

## Проверка

1. Открой этот проект в Claude Code.
2. Попроси агента что-нибудь «запомнить в memory». Ожидание: hook
   блокирует Write, возвращает `permissionDecision: "deny"` с
   пояснением, агент не создаёт файл в `~/.claude/projects/*/memory/`.
3. Проверь на другом проекте, не подписанном на этот контракт (без
   `context/project.yml` или с другим `sync.contract.key`). Ожидание:
   hook молча пропускает Write, memory пишется как обычно.

## Если что-то пошло не так

- Hook блокирует Write везде → проверь, что `jq` установлен и что
  `case` на путь корректно матчит только `~/.claude/projects/*/memory/*`.
- Hook не срабатывает в целевом проекте → проверь, что `sync.contract.key`
  в `context/project.yml` совпадает с суффиксом имени файла hook.
  `yq -r '.sync.contract.key' context/project.yml` должно выдать
  `agent-operational-contract-v2`.
- Регистрация в `settings.json` не подхватывается → перезапусти Claude
  Code (session-level кэш настроек).

## Отключение

1. Удалить строку с командой скрипта из `~/.claude/settings.json`
   (блок `hooks.PreToolUse`, объект с `matcher: "Write"`).
2. Удалить сам файл
   `~/.claude/hooks/block-memory-write-for-agent-operational-contract-v2.sh`.

Проектная документация правило про memory продолжает держать —
`context/conventions/openness.yml`. Hook лишь страхует его технически.
