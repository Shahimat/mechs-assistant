// Tauri app для распознавания инвентаря игры «Мехи.Земля».
// Rust-часть отвечает за:
//   1) перечисление и capture окон (xcap);
//   2) template matching UI-рамки инвентаря (imageproc, Phase D);
//   3) разбиение области на ячейки — делается на клиенте (Phase E).
// UI, pHash matching и OCR — во фронтенде React (Phase E).

use base64::Engine;
use image::codecs::png::PngEncoder;
use image::{DynamicImage, ExtendedColorType, GrayImage, ImageEncoder};
use imageproc::template_matching::{match_template, MatchTemplateMethod};
use serde::Serialize;
use std::collections::HashMap;
use std::io::Cursor;
use std::path::PathBuf;

/// Эталон верхнего-левого угла UI-рамки инвентаря игры. Захардкожен в
/// бинарник через include_bytes! — не зависит от текущей директории при
/// запуске. При изменении шаблона (новый скин UI, кастом-разрешение)
/// правим этот файл и пересобираем.
const INVENTORY_CORNER_TEMPLATE: &[u8] = include_bytes!("../assets/inventory-corner.png");

#[derive(Serialize)]
struct WindowInfo {
    id: u32,
    title: String,
    width: u32,
    height: u32,
    is_minimized: bool,
}

#[derive(Serialize)]
struct CapturedWindow {
    title: String,
    width: u32,
    height: u32,
    /// PNG-снимок окна, base64-encoded для передачи в WebView через IPC.
    png_base64: String,
}

#[derive(Serialize)]
struct InventoryCorner {
    x: u32,
    y: u32,
    /// Ширина эталона (px). Клиент использует, чтобы понять «размер уголка»
    /// и, если понадобится, откорректировать точку начала сетки.
    template_width: u32,
    template_height: u32,
    /// SSD-normalized score. Меньше = лучше (0 = идеальное совпадение).
    /// Клиент считает confidence = 1 - score.
    score: f32,
}

#[tauri::command]
fn list_windows() -> Result<Vec<WindowInfo>, String> {
    let windows = xcap::Window::all().map_err(|e| e.to_string())?;
    let mut out = Vec::with_capacity(windows.len());
    for w in windows {
        let title = w.title().unwrap_or_default();
        let width = w.width().unwrap_or(0);
        let height = w.height().unwrap_or(0);
        let is_minimized = w.is_minimized().unwrap_or(false);
        let id = w.id().unwrap_or(0);
        out.push(WindowInfo {
            id,
            title,
            width,
            height,
            is_minimized,
        });
    }
    Ok(out)
}

#[tauri::command]
async fn capture_window(title_pattern: String) -> Result<CapturedWindow, String> {
    let pattern = title_pattern.trim().to_lowercase();
    if pattern.is_empty() {
        return Err("title_pattern пустой".into());
    }

    let windows = xcap::Window::all().map_err(|e| e.to_string())?;
    let window = windows
        .into_iter()
        .find(|w| {
            let t = w.title().unwrap_or_default().to_lowercase();
            t.contains(&pattern)
        })
        .ok_or_else(|| format!("Окно с title, содержащим «{}», не найдено", title_pattern))?;

    let title = window.title().unwrap_or_default();

    if window.is_minimized().unwrap_or(false) {
        return Err(format!("Окно «{}» свёрнуто — сначала разверни его", title));
    }

    let image = window
        .capture_image()
        .map_err(|e| format!("Не удалось снять окно «{}»: {}", title, e))?;
    let width = image.width();
    let height = image.height();

    let mut png_buf = Vec::new();
    PngEncoder::new(&mut png_buf)
        .write_image(image.as_raw(), width, height, ExtendedColorType::Rgba8)
        .map_err(|e| e.to_string())?;

    let png_base64 = base64::engine::general_purpose::STANDARD.encode(&png_buf);

    Ok(CapturedWindow {
        title,
        width,
        height,
        png_base64,
    })
}

fn decode_png_grayscale(png_bytes: &[u8]) -> Result<GrayImage, String> {
    let dynamic = image::load_from_memory(png_bytes).map_err(|e| e.to_string())?;
    Ok(dynamic.into_luma8())
}

fn decode_base64_png_grayscale(png_base64: &str) -> Result<GrayImage, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(png_base64)
        .map_err(|e| format!("base64 decode failed: {}", e))?;
    decode_png_grayscale(&bytes)
}

/// Ищет верхний-левый угол UI-рамки инвентаря на скриншоте окна игры.
/// Использует imageproc::template_matching::match_template с методом
/// SumOfSquaredErrorsNormalized — устойчив к освещению и малым сжатиям.
///
/// UI игры может содержать несколько похожих уголков (аукцион, миникарта,
/// чат). Инвентарь всегда находится в **правой** части окна — поэтому
/// принимаем только match'и с `x >= width / 2`.
///
/// Возвращает лучший match. Если ни один не проходит порог — Ok(None).
#[tauri::command]
async fn find_inventory_corner(png_base64: String) -> Result<Option<InventoryCorner>, String> {
    let screen = decode_base64_png_grayscale(&png_base64)?;
    let template = decode_png_grayscale(INVENTORY_CORNER_TEMPLATE)?;

    let sw = screen.width();
    let sh = screen.height();
    let tw = template.width();
    let th = template.height();

    if tw >= sw || th >= sh {
        return Err(format!(
            "Template ({}×{}) больше или равен скрину ({}×{})",
            tw, th, sw, sh
        ));
    }

    let result = match_template(
        &screen,
        &template,
        MatchTemplateMethod::SumOfSquaredErrorsNormalized,
    );

    // Ищем минимум в правой половине скрина (инвентарь всегда справа).
    // result имеет размеры (sw - tw + 1, sh - th + 1).
    let rw = result.width();
    let rh = result.height();
    let x_min_search = sw / 2;

    let mut best_x: u32 = 0;
    let mut best_y: u32 = 0;
    let mut best_score: f32 = f32::MAX;

    for y in 0..rh {
        for x in x_min_search..rw {
            let v = result.get_pixel(x, y)[0];
            if v < best_score {
                best_score = v;
                best_x = x;
                best_y = y;
            }
        }
    }

    // Пороги эмпирические:
    // - < 0.15 → почти точное совпадение;
    // - > 0.5  → скорее всего false-positive.
    if best_score > 0.5 {
        return Ok(None);
    }

    Ok(Some(InventoryCorner {
        x: best_x,
        y: best_y,
        template_width: tw,
        template_height: th,
        score: best_score,
    }))
}

/// Диагностическая команда: находит уголок инвентаря и возвращает
/// PNG-скриншот с нарисованным прямоугольником вокруг найденной области
/// (~200×300 вправо и вниз от уголка — эмпирическая оценка инвентаря).
/// Помогает быстро увидеть, куда попал matching, если промахивается.
#[tauri::command]
async fn debug_visualize_corner(png_base64: String) -> Result<String, String> {
    let corner = find_inventory_corner(png_base64.clone()).await?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&png_base64)
        .map_err(|e| e.to_string())?;
    let mut dynamic = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;

    if let Some(c) = corner {
        let mut buf = dynamic.to_rgba8();
        let outline = [255u8, 0, 0, 255];

        let x0 = c.x;
        let y0 = c.y;
        let x1 = (c.x + c.template_width + 200).min(buf.width() - 1);
        let y1 = (c.y + c.template_height + 300).min(buf.height() - 1);
        for x in x0..=x1 {
            if y0 < buf.height() {
                buf.put_pixel(x, y0, image::Rgba(outline));
            }
            if y1 < buf.height() {
                buf.put_pixel(x, y1, image::Rgba(outline));
            }
        }
        for y in y0..=y1 {
            if x0 < buf.width() {
                buf.put_pixel(x0, y, image::Rgba(outline));
            }
            if x1 < buf.width() {
                buf.put_pixel(x1, y, image::Rgba(outline));
            }
        }

        dynamic = DynamicImage::ImageRgba8(buf);
    }

    let mut out = Vec::new();
    dynamic
        .write_to(&mut Cursor::new(&mut out), image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(&out))
}

/// Пишет байты (переданные из фронтенда как base64) в выбранный
/// пользователем путь. Путь приходит из диалога сохранения
/// (`tauri-plugin-dialog` на клиенте); саму запись делаем здесь, чтобы
/// не тащить `fs`-плагин с настройкой scope. Своя команда через
/// invoke_handler разрешена без ACL-записи.
#[tauri::command]
fn write_file_base64(path: String, contents_base64: String) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&contents_base64)
        .map_err(|e| format!("base64 decode failed: {}", e))?;
    std::fs::write(&path, bytes).map_err(|e| format!("Не удалось записать «{}»: {}", path, e))
}

/// Найденная установленная версия игрового клиента.
#[derive(Serialize)]
struct GameBuild {
    /// Человекочитаемая версия, например «4.1.1 (build 8733)».
    version_label: String,
    /// Имя папки версии, например «v4-1-1-8733».
    dir_name: String,
    /// Полный путь до исполняемого файла игры.
    exe_path: String,
}

const GAME_EXE: &str = "MechsEarth.exe";

/// Дефолтная папка игры: `%LOCALAPPDATA%\MechsEarth\bin`. На не-Windows
/// LOCALAPPDATA нет — вернёт None, команда попросит указать путь вручную.
fn default_game_dir() -> Option<std::path::PathBuf> {
    std::env::var_os("LOCALAPPDATA")
        .map(|la| std::path::PathBuf::from(la).join("MechsEarth").join("bin"))
}

/// Разбирает имя папки версии `v<A>-<B>-<C>-<BUILD>` в вектор чисел для
/// сравнения. Число компонентов не фиксировано — сравниваем лексикографически.
fn parse_version(name: &str) -> Option<Vec<u64>> {
    let stripped = name.strip_prefix('v').or_else(|| name.strip_prefix('V'))?;
    let parts: Result<Vec<u64>, _> = stripped.split('-').map(str::parse::<u64>).collect();
    match parts {
        Ok(v) if !v.is_empty() => Some(v),
        _ => None,
    }
}

fn format_version(parts: &[u64]) -> String {
    match parts {
        [a, b, c, build] => format!("{}.{}.{} (build {})", a, b, c, build),
        rest => rest
            .iter()
            .map(u64::to_string)
            .collect::<Vec<_>>()
            .join("."),
    }
}

/// Сканирует папку игры, выбирает подпапку версии с максимальным номером,
/// внутри которой лежит `MechsEarth.exe`. Устойчиво к смене папки версии
/// после установки апдейта — жёсткий путь не хранится.
fn resolve_latest(base_dir: Option<String>) -> Result<GameBuild, String> {
    let base = match base_dir {
        Some(d) if !d.trim().is_empty() => std::path::PathBuf::from(d.trim()),
        _ => default_game_dir()
            .ok_or("Не удалось определить %LOCALAPPDATA% — укажи путь до папки игры вручную")?,
    };
    if !base.is_dir() {
        return Err(format!("Папка игры не найдена: {}", base.display()));
    }

    let entries =
        std::fs::read_dir(&base).map_err(|e| format!("Не удалось прочитать {}: {}", base.display(), e))?;

    let mut best: Option<(Vec<u64>, std::path::PathBuf, String)> = None;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if !entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            continue;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        let Some(version) = parse_version(&name) else {
            continue;
        };
        let exe = entry.path().join(GAME_EXE);
        if !exe.is_file() {
            continue;
        }
        let better = best.as_ref().map(|(bv, _, _)| version > *bv).unwrap_or(true);
        if better {
            best = Some((version, exe, name));
        }
    }

    match best {
        Some((version, exe, dir_name)) => Ok(GameBuild {
            version_label: format_version(&version),
            dir_name,
            exe_path: exe.to_string_lossy().into_owned(),
        }),
        None => Err(format!(
            "В {} не найдено ни одной версии игры (папки вида vA-B-C-BUILD с {})",
            base.display(),
            GAME_EXE
        )),
    }
}

/// Возвращает последнюю установленную версию игры без запуска — UI
/// показывает её на главной странице. `async`, чтобы Tauri выполнял скан
/// папки вне главного потока и не подвешивал UI.
#[tauri::command]
async fn find_latest_game(base_dir: Option<String>) -> Result<GameBuild, String> {
    resolve_latest(base_dir)
}

/// Находит последнюю установленную версию и запускает её. Всегда стартует
/// самый свежий билд независимо от того, как поменялась папка версии.
/// `async` + `spawn_blocking`: `CreateProcess` (его на Windows нередко
/// притормаживает Defender) уходит в blocking-пул, главный поток и UI не
/// фризят на время старта.
#[tauri::command]
async fn launch_game(base_dir: Option<String>) -> Result<GameBuild, String> {
    let build = resolve_latest(base_dir)?;
    let exe = std::path::PathBuf::from(&build.exe_path);
    let exe_path = build.exe_path.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let mut command = std::process::Command::new(&exe);
        if let Some(dir) = exe.parent() {
            command.current_dir(dir);
        }
        command.spawn().map(|_| ())
    })
    .await
    .map_err(|e| format!("Внутренняя ошибка запуска: {}", e))?
    .map_err(|e| format!("Не удалось запустить {}: {}", exe_path, e))?;
    Ok(build)
}

/// Закрывает все запущенные сессии игры (окна/процессы `MechsEarth.exe`).
/// На Windows — форсированный `taskkill /F /IM`; код 128 (процессов нет)
/// трактуем как успех «закрывать нечего». Кто-то держит несколько окон
/// сразу — команда снимает их все одним вызовом.
#[tauri::command]
async fn close_all_games() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("taskkill")
            .args(["/F", "/IM", GAME_EXE])
            .output()
            .map_err(|e| format!("Не удалось вызвать taskkill: {}", e))?;
        if output.status.success() || output.status.code() == Some(128) {
            return Ok(());
        }
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("taskkill завершился с ошибкой: {}", stderr.trim()))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Закрытие сессий игры доступно только на Windows".into())
    }
}

// ── Настройки игры (UserDefault.xml) ──────────────────────────────────
//
// Конфиг игры — плоский `<userDefaultRoot>` с листовыми элементами
// `<Key type="int|bool|float|str">value</Key>`. Часть ключей содержит `:` и
// `::` (`Keyboard:UseWeapon1`, `Game:Colors:MySet`) — по строгому XML это
// невалидные имена элементов, но игра читает своим снисходительным парсером.
// Поэтому парсим ТОЛЕРАНТНО (посимвольный скан, имя элемента берём целиком),
// а правку делаем точечной заменой значения внутри `<Key ...>…</Key>` в
// исходном тексте — так сохраняется формат, порядок и нетронутые ключи
// (включая непрозрачные блобы UI:Setting / Game:Colors:*).

const CONFIG_FILE: &str = "UserDefault.xml";
const BACKUP_FILE: &str = "UserDefault.backup.xml";
const REG_EMAIL: &str = "LastEmail";
const REG_LICENSE: &str = "LicenseKey";

/// Одна настройка конфига. `type` — тип из XML-атрибута (int/bool/float/str),
/// клиент выбирает виджет по нему. Serialize (в UI) + Deserialize (обратно
/// при сохранении).
#[derive(Serialize, serde::Deserialize)]
struct SettingEntry {
    key: String,
    #[serde(rename = "type")]
    typ: String,
    value: String,
}

/// Разобранный элемент конфига с байтовыми границами внутреннего значения —
/// границы нужны для точечной замены при обратной записи.
struct RawEntry {
    key: String,
    typ: String,
    value: String,
    value_start: usize,
    value_end: usize,
}

fn extract_attr(tag_inner: &str, attr: &str) -> Option<String> {
    let needle = format!("{}=\"", attr);
    let start = tag_inner.find(&needle)? + needle.len();
    let rest = &tag_inner[start..];
    let end = rest.find('"')?;
    Some(rest[..end].to_string())
}

/// Толерантный разбор конфига в упорядоченный список элементов. Идёт по
/// байтам, но все срезы делаются на позициях ASCII-символов `<`/`>` — это
/// границы UTF-8, значения с не-ASCII (email и т.п.) не ломают индексацию.
fn parse_entries(text: &str) -> Vec<RawEntry> {
    let bytes = text.as_bytes();
    let mut entries = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] != b'<' {
            i += 1;
            continue;
        }
        // Пропускаем декларацию/закрывающий/комментарий/корень.
        if text[i..].starts_with("<?") || text[i..].starts_with("</") || text[i..].starts_with("<!")
        {
            i += 1;
            continue;
        }
        let Some(gt_rel) = text[i..].find('>') else { break };
        let tag_end = i + gt_rel; // индекс '>'
        let tag_inner = &text[i + 1..tag_end];
        let self_closing = tag_inner.ends_with('/');
        let name_end = tag_inner
            .find(char::is_whitespace)
            .unwrap_or(tag_inner.len());
        let name = tag_inner[..name_end].trim_end_matches('/').to_string();
        if name.is_empty() || name == "userDefaultRoot" {
            i = tag_end + 1;
            continue;
        }
        let typ = extract_attr(tag_inner, "type").unwrap_or_default();
        if self_closing {
            entries.push(RawEntry {
                key: name,
                typ,
                value: String::new(),
                value_start: tag_end + 1,
                value_end: tag_end + 1,
            });
            i = tag_end + 1;
            continue;
        }
        let value_start = tag_end + 1;
        let close = format!("</{}>", name);
        let Some(close_rel) = text[value_start..].find(&close) else {
            i = tag_end + 1;
            continue;
        };
        let value_end = value_start + close_rel;
        entries.push(RawEntry {
            key: name,
            typ,
            value: text[value_start..value_end].to_string(),
            value_start,
            value_end,
        });
        i = value_end + close.len();
    }
    entries
}

/// Возвращает копию текста конфига с заменёнными значениями для ключей из
/// `updates` (остальное — как было). Ключей, отсутствующих в файле, не
/// добавляет. Замены идут от конца к началу, чтобы байтовые границы не
/// сдвигались по ходу.
fn apply_updates(text: &str, updates: &HashMap<String, String>) -> String {
    let mut owned: Vec<(usize, usize, String)> = parse_entries(text)
        .into_iter()
        .filter_map(|e| updates.get(&e.key).map(|v| (e.value_start, e.value_end, v.clone())))
        .collect();
    owned.sort_by(|a, b| b.0.cmp(&a.0));
    let mut result = text.to_string();
    for (start, end, value) in owned {
        result.replace_range(start..end, &value);
    }
    result
}

fn registration_blank() -> HashMap<String, String> {
    let mut m = HashMap::new();
    m.insert(REG_EMAIL.to_string(), String::new());
    m.insert(REG_LICENSE.to_string(), String::new());
    m
}

/// Папка игры (`…\MechsEarth`, родитель `bin`), где лежат конфиг и бэкап.
/// gameDir хранит путь до `bin` — конфиг на уровень выше.
fn resolve_config_dir(base_dir: Option<String>) -> Result<PathBuf, String> {
    let base = match base_dir {
        Some(d) if !d.trim().is_empty() => PathBuf::from(d.trim()),
        _ => default_game_dir()
            .ok_or("Не удалось определить %LOCALAPPDATA% — укажи путь до папки игры вручную")?,
    };
    base.parent()
        .map(|p| p.to_path_buf())
        .ok_or_else(|| format!("Не удалось определить папку игры относительно {}", base.display()))
}

/// Читает конфиг игры в упорядоченный список настроек. При первом чтении
/// создаёт бэкап-дамп `UserDefault.backup.xml` рядом с конфигом БЕЗ
/// регистрационных данных (email + лицензионный ключ затёрты) — эталон
/// «вернуть как было». Чистый fs+XML — работает и в dev при явном baseDir.
#[tauri::command]
fn read_game_settings(base_dir: Option<String>) -> Result<Vec<SettingEntry>, String> {
    let dir = resolve_config_dir(base_dir)?;
    let config = dir.join(CONFIG_FILE);
    let text = std::fs::read_to_string(&config)
        .map_err(|e| format!("Не удалось прочитать {}: {}", config.display(), e))?;

    let backup = dir.join(BACKUP_FILE);
    if !backup.exists() {
        let dump = apply_updates(&text, &registration_blank());
        std::fs::write(&backup, dump)
            .map_err(|e| format!("Не удалось создать бэкап {}: {}", backup.display(), e))?;
    }

    Ok(parse_entries(&text)
        .into_iter()
        .map(|e| SettingEntry {
            key: e.key,
            typ: e.typ,
            value: e.value,
        })
        .collect())
}

/// Пишет отредактированные значения обратно в конфиг с сохранением формата
/// (порядок, type-атрибуты, нетронутые ключи). Регистрационные ключи через
/// этот путь не трогаем — в редакторе они скрыты, чистятся отдельной командой.
#[tauri::command]
fn write_game_settings(base_dir: Option<String>, entries: Vec<SettingEntry>) -> Result<(), String> {
    let dir = resolve_config_dir(base_dir)?;
    let config = dir.join(CONFIG_FILE);
    let text = std::fs::read_to_string(&config)
        .map_err(|e| format!("Не удалось прочитать {}: {}", config.display(), e))?;

    let mut updates = HashMap::new();
    for e in entries {
        if e.key == REG_EMAIL || e.key == REG_LICENSE {
            continue;
        }
        updates.insert(e.key, e.value);
    }
    let out = apply_updates(&text, &updates);
    std::fs::write(&config, out)
        .map_err(|e| format!("Не удалось записать {}: {}", config.display(), e))
}

/// «Вернуть как было»: применяет значения из бэкапа к живому конфигу,
/// СОХРАНЯЯ текущие регданные (в бэкапе их нет намеренно — восстановление
/// настроек не должно разлогинивать игру).
#[tauri::command]
fn restore_game_settings(base_dir: Option<String>) -> Result<(), String> {
    let dir = resolve_config_dir(base_dir)?;
    let config = dir.join(CONFIG_FILE);
    let backup = dir.join(BACKUP_FILE);
    let backup_text = std::fs::read_to_string(&backup)
        .map_err(|e| format!("Бэкап не найден ({}): {}", backup.display(), e))?;
    let config_text = std::fs::read_to_string(&config)
        .map_err(|e| format!("Не удалось прочитать {}: {}", config.display(), e))?;

    let mut updates = HashMap::new();
    for e in parse_entries(&backup_text) {
        if e.key == REG_EMAIL || e.key == REG_LICENSE {
            continue;
        }
        updates.insert(e.key, e.value);
    }
    let out = apply_updates(&config_text, &updates);
    std::fs::write(&config, out)
        .map_err(|e| format!("Не удалось записать {}: {}", config.display(), e))
}

/// Удаляет из конфига регистрационные данные — затирает значения
/// `LastEmail` и `LicenseKey` (email + лицензионный ключ).
#[tauri::command]
fn strip_registration(base_dir: Option<String>) -> Result<(), String> {
    let dir = resolve_config_dir(base_dir)?;
    let config = dir.join(CONFIG_FILE);
    let text = std::fs::read_to_string(&config)
        .map_err(|e| format!("Не удалось прочитать {}: {}", config.display(), e))?;
    let out = apply_updates(&text, &registration_blank());
    std::fs::write(&config, out)
        .map_err(|e| format!("Не удалось записать {}: {}", config.display(), e))
}

/// Открывает файловый менеджер на папке игры (`…\MechsEarth`). Explorer на
/// Windows; на других ОС — Err (игра Windows-only, дефолтный путь через
/// %LOCALAPPDATA% разворачивается лишь там).
#[tauri::command]
fn open_game_folder(base_dir: Option<String>) -> Result<(), String> {
    let dir = resolve_config_dir(base_dir)?;
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|e| format!("Не удалось открыть проводник: {}", e))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = dir;
        Err("Открытие папки игры доступно только на Windows".into())
    }
}

/// Один ребинд: какую кнопку мыши (`button`: XButton1/XButton2/Middle) на
/// какую игровую клавишу (`key`: одиночный символ, VK-код по ASCII) слать.
/// Дефолт повторяет AHK-скрипт игрока (XButton1→'4', XButton2→'6').
#[derive(serde::Deserialize)]
#[allow(dead_code)] // поля читаются только под Windows (mouse_remap-модуль)
struct MouseBinding {
    button: String,
    key: String,
}

/// Включает нативный ребинд боковых кнопок мыши на игровые клавиши: ставит
/// низкоуровневый хук `WH_MOUSE_LL` на выделенном потоке. Клавиша уходит
/// PostMessage'ем ТОЛЬКО в активное окно `MechsEarth.exe`, исходное mouse-
/// событие проглатывается. Вне игры кнопки работают штатно. Заменяет внешний
/// AHK-скрипт. Повторный вызов пересобирает маппинг. Windows-only. См.
/// other--cop-native-bridge-remaps-mouse-to-active-window.
#[tauri::command]
fn start_mouse_remap(bindings: Vec<MouseBinding>) -> Result<(), String> {
    #[cfg(windows)]
    {
        mouse_remap::start(bindings)
    }
    #[cfg(not(windows))]
    {
        let _ = bindings;
        Err("Ребинд мыши доступен только на Windows".into())
    }
}

/// Снимает хук мыши и останавливает его поток — кнопки снова ведут себя
/// нативно. Идемпотентна (без активного хука — no-op Ok). Windows-only.
#[tauri::command]
fn stop_mouse_remap() -> Result<(), String> {
    #[cfg(windows)]
    {
        mouse_remap::stop()
    }
    #[cfg(not(windows))]
    {
        Err("Ребинд мыши доступен только на Windows".into())
    }
}

/// Окно запущенного инстанса игры с абсолютной геометрией (система
/// виртуального рабочего стола → мультимонитор из коробки, x/y могут быть
/// отрицательными). Координаты пишутся в пресет раскладки на клиенте.
#[derive(Serialize)]
#[allow(dead_code)] // конструируется только под Windows (win-модуль)
struct GameWindow {
    pid: u32,
    title: String,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

/// Один слот пресета раскладки — целевой прямоугольник окна.
#[derive(serde::Deserialize)]
#[allow(dead_code)] // поля читаются только под Windows (win-модуль)
struct ArrangeSlot {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

/// Сводка мультизапуска: сколько инстансов стартовало/размещено + список
/// предупреждений (окна, не появившиеся за таймаут, и т.п.).
#[derive(Serialize)]
#[allow(dead_code)] // конструируется только под Windows (win-модуль)
struct ArrangeSummary {
    launched: usize,
    arranged: usize,
    warnings: Vec<String>,
}

/// Перечисляет top-level видимые окна процессов `MechsEarth.exe` с
/// геометрией — клиент сохраняет как пресет «запомни как сейчас».
/// Windows-only (перечисление и координаты — Windows-API). `async` +
/// `spawn_blocking`: обход окон/процессов не блокирует главный поток.
#[tauri::command]
async fn list_game_windows() -> Result<Vec<GameWindow>, String> {
    #[cfg(windows)]
    {
        tauri::async_runtime::spawn_blocking(win::list_game_windows_impl)
            .await
            .map_err(|e| format!("Внутренняя ошибка перечисления окон: {}", e))?
    }
    #[cfg(not(windows))]
    {
        Err("Перечисление окон игры доступно только на Windows".into())
    }
}

/// Мультизапуск + раскладка: стартует `slots.len()` инстансов последней
/// версии и раскладывает их окна по пресету (слот↔окно по порядку запуска
/// PID). Не появившееся за таймаут окно пропускается с предупреждением —
/// частичный успех не роняет операцию. Windows-only, `async` +
/// `spawn_blocking` (блокирующий цикл спавна/поллинга вне главного потока).
#[tauri::command]
async fn launch_and_arrange(
    base_dir: Option<String>,
    slots: Vec<ArrangeSlot>,
) -> Result<ArrangeSummary, String> {
    #[cfg(windows)]
    {
        let build = resolve_latest(base_dir)?;
        tauri::async_runtime::spawn_blocking(move || win::launch_and_arrange_impl(build, slots))
            .await
            .map_err(|e| format!("Внутренняя ошибка запуска и раскладки: {}", e))?
    }
    #[cfg(not(windows))]
    {
        let _ = (base_dir, slots);
        Err("Раскладка окон игры доступна только на Windows".into())
    }
}

/// Windows-специфичная реализация перечисления и раскладки окон игры.
/// На crate `winapi` (замороженные C-сигнатуры). Весь модуль под
/// `#[cfg(windows)]` — на macOS/Linux не компилируется (там ветки команд
/// возвращают Err). Не проверяется `cargo check` на не-Windows.
#[cfg(windows)]
mod win {
    use super::{ArrangeSlot, ArrangeSummary, GameBuild, GameWindow, GAME_EXE};
    use std::collections::HashSet;
    use std::time::{Duration, Instant};
    use winapi::shared::minwindef::{BOOL, DWORD, FALSE, LPARAM, TRUE};
    use winapi::shared::windef::{HWND, RECT};
    use winapi::um::handleapi::{CloseHandle, INVALID_HANDLE_VALUE};
    use winapi::um::tlhelp32::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };
    use winapi::um::winuser::{
        EnumWindows, GetWindowRect, GetWindowTextW, GetWindowThreadProcessId, IsWindowVisible,
        SetWindowPos, ShowWindow, HWND_TOP, SWP_NOACTIVATE, SWP_NOZORDER, SW_RESTORE,
    };

    /// Сколько ждём появления окна нового инстанса (медленная загрузка /
    /// Defender / игра думает над вторым инстансом).
    const WINDOW_WAIT: Duration = Duration::from_secs(15);
    const POLL_STEP: Duration = Duration::from_millis(250);

    /// Пауза между стартами инстансов при мультизапуске (после появления окна
    /// предыдущего). У игры общий на всю папку version-файл; лаунчер трогает
    /// его на этапе «Проверка обновления» уже ПОСЛЕ показа окна, поэтому мало
    /// дождаться окна — нужен grace, чтобы предыдущий лаунчер прошёл проверку
    /// и отпустил файл. Иначе одновременные лаунчеры ловят «файл версии не
    /// корректен» (гонка чтения/записи). Если проверка версии на медленном
    /// коннекте длиннее — увеличить.
    const LAUNCH_STAGGER: Duration = Duration::from_millis(1500);

    struct RawWindow {
        hwnd: HWND,
        pid: u32,
        title: String,
        rect: RECT,
    }

    /// EnumWindows callback: копит видимые top-level окна ненулевого
    /// размера с их pid/заголовком/геометрией в переданный через lparam Vec.
    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let acc = &mut *(lparam as *mut Vec<RawWindow>);
        if IsWindowVisible(hwnd) == FALSE {
            return TRUE;
        }
        let mut rect = RECT {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };
        if GetWindowRect(hwnd, &mut rect) == FALSE {
            return TRUE;
        }
        if rect.right - rect.left <= 0 || rect.bottom - rect.top <= 0 {
            return TRUE;
        }
        let mut pid: DWORD = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == 0 {
            return TRUE;
        }
        let mut buf = [0u16; 512];
        let len = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
        let title = if len > 0 {
            String::from_utf16_lossy(&buf[..len as usize])
        } else {
            String::new()
        };
        acc.push(RawWindow {
            hwnd,
            pid,
            title,
            rect,
        });
        TRUE
    }

    fn enum_windows() -> Vec<RawWindow> {
        let mut acc: Vec<RawWindow> = Vec::new();
        unsafe {
            EnumWindows(Some(enum_proc), &mut acc as *mut _ as LPARAM);
        }
        acc
    }

    fn wide_to_string(buf: &[u16]) -> String {
        let end = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
        String::from_utf16_lossy(&buf[..end])
    }

    /// PID'ы всех запущенных процессов `MechsEarth.exe` (по имени exe —
    /// устойчиво к локализации заголовка).
    fn game_pids() -> Result<HashSet<u32>, String> {
        let mut pids = HashSet::new();
        unsafe {
            let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snapshot == INVALID_HANDLE_VALUE {
                return Err("CreateToolhelp32Snapshot вернул INVALID_HANDLE_VALUE".into());
            }
            let mut entry: PROCESSENTRY32W = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
            if Process32FirstW(snapshot, &mut entry) != FALSE {
                loop {
                    if wide_to_string(&entry.szExeFile).eq_ignore_ascii_case(GAME_EXE) {
                        pids.insert(entry.th32ProcessID);
                    }
                    if Process32NextW(snapshot, &mut entry) == FALSE {
                        break;
                    }
                }
            }
            CloseHandle(snapshot);
        }
        Ok(pids)
    }

    pub fn list_game_windows_impl() -> Result<Vec<GameWindow>, String> {
        let pids = game_pids()?;
        let mut seen = HashSet::new();
        let mut out = Vec::new();
        for w in enum_windows() {
            if !pids.contains(&w.pid) || !seen.insert(w.pid) {
                continue; // не игра или уже взяли одно окно на этот процесс
            }
            out.push(GameWindow {
                pid: w.pid,
                title: w.title,
                x: w.rect.left,
                y: w.rect.top,
                width: w.rect.right - w.rect.left,
                height: w.rect.bottom - w.rect.top,
            });
        }
        Ok(out)
    }

    /// Ждёт появления top-level видимого окна процесса `pid` (поллинг с
    /// таймаутом) — окно возникает не мгновенно после spawn.
    fn wait_for_window(pid: u32) -> Option<HWND> {
        let start = Instant::now();
        while start.elapsed() < WINDOW_WAIT {
            if let Some(w) = enum_windows().into_iter().find(|w| w.pid == pid) {
                return Some(w.hwnd);
            }
            std::thread::sleep(POLL_STEP);
        }
        None
    }

    fn arrange_window(hwnd: HWND, slot: &ArrangeSlot) -> bool {
        unsafe {
            ShowWindow(hwnd, SW_RESTORE);
            SetWindowPos(
                hwnd,
                HWND_TOP,
                slot.x,
                slot.y,
                slot.width,
                slot.height,
                SWP_NOACTIVATE | SWP_NOZORDER,
            ) != FALSE
        }
    }

    pub fn launch_and_arrange_impl(
        build: GameBuild,
        slots: Vec<ArrangeSlot>,
    ) -> Result<ArrangeSummary, String> {
        let exe = std::path::PathBuf::from(&build.exe_path);
        let cwd = exe.parent().map(|p| p.to_path_buf());

        // Запуск ПОСЛЕДОВАТЕЛЬНЫЙ, не залпом: спавн → ждём окно этого инстанса
        // → раскладываем → пауза (LAUNCH_STAGGER) перед следующим стартом.
        // Иначе одновременные лаунчеры конкурируют за общий version-файл папки
        // → «файл версии не корректен» / зависание на «Проверка обновления».
        let mut warnings = Vec::new();
        let mut launched = 0usize;
        let mut arranged = 0usize;
        let total = slots.len();
        for (i, slot) in slots.iter().enumerate() {
            let mut command = std::process::Command::new(&exe);
            if let Some(dir) = &cwd {
                command.current_dir(dir);
            }
            let pid = match command.spawn() {
                Ok(child) => {
                    launched += 1;
                    child.id()
                }
                Err(e) => {
                    warnings.push(format!("Инстанс {}: не удалось запустить — {}", i + 1, e));
                    continue;
                }
            };

            match wait_for_window(pid) {
                Some(hwnd) if arrange_window(hwnd, slot) => arranged += 1,
                Some(_) => warnings.push(format!(
                    "Инстанс {} (pid {}): окно найдено, но не удалось разместить",
                    i + 1,
                    pid
                )),
                None => warnings.push(format!(
                    "Инстанс {} (pid {}): окно не появилось за {} с — пропущено",
                    i + 1,
                    pid,
                    WINDOW_WAIT.as_secs()
                )),
            }

            // Grace перед следующим стартом (после последнего не нужен): даём
            // текущему лаунчеру пройти проверку версии и отпустить файл.
            if i + 1 < total {
                std::thread::sleep(LAUNCH_STAGGER);
            }
        }

        Ok(ArrangeSummary {
            launched,
            arranged,
            warnings,
        })
    }
}

/// Windows-специфичный нативный ребинд мыши (замена AHK-скрипта). Хук
/// `WH_MOUSE_LL` живёт на выделенном потоке с message-loop; колбэк — C-ABI,
/// поэтому маппинг и состояние потока держим в статиках. Весь модуль под
/// `#[cfg(windows)]` (не компилируется и не проверяется на macOS/Linux).
#[cfg(windows)]
mod mouse_remap {
    use super::{MouseBinding, GAME_EXE};
    use std::collections::HashMap;
    use std::os::raw::c_int;
    use std::ptr::null_mut;
    use std::sync::mpsc;
    use std::sync::{Mutex, OnceLock};
    use std::thread::JoinHandle;
    use winapi::shared::minwindef::{DWORD, FALSE, LPARAM, LRESULT, WPARAM};
    use winapi::shared::windef::{HHOOK, HWND};
    use winapi::um::handleapi::{CloseHandle, INVALID_HANDLE_VALUE};
    use winapi::um::libloaderapi::GetModuleHandleW;
    use winapi::um::processthreadsapi::GetCurrentThreadId;
    use winapi::um::tlhelp32::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };
    use winapi::um::winuser::{
        CallNextHookEx, GetForegroundWindow, GetMessageW, GetWindowThreadProcessId, MapVirtualKeyW,
        PostMessageW, PostThreadMessageW, SetWindowsHookExW, UnhookWindowsHookEx, HC_ACTION,
        MAPVK_VK_TO_VSC, MSG, MSLLHOOKSTRUCT, WH_MOUSE_LL, WM_KEYDOWN, WM_KEYUP, WM_MBUTTONDOWN,
        WM_QUIT, WM_XBUTTONDOWN, XBUTTON1, XBUTTON2,
    };

    // Триггеры кодируем числом (ключ карты биндингов): 1 = XButton1,
    // 2 = XButton2, 3 = средняя кнопка.
    const TRIGGER_XBUTTON1: u32 = 1;
    const TRIGGER_XBUTTON2: u32 = 2;
    const TRIGGER_MIDDLE: u32 = 3;

    struct HookState {
        thread_id: DWORD,
        join: JoinHandle<()>,
    }

    // Активный маппинг триггер→VK читается из C-колбэка → отдельный статик с
    // быстрым доступом под мьютексом. Состояние потока хука — свой статик.
    static BINDINGS: OnceLock<Mutex<HashMap<u32, u16>>> = OnceLock::new();
    static STATE: OnceLock<Mutex<Option<HookState>>> = OnceLock::new();

    fn bindings() -> &'static Mutex<HashMap<u32, u16>> {
        BINDINGS.get_or_init(|| Mutex::new(HashMap::new()))
    }

    fn state() -> &'static Mutex<Option<HookState>> {
        STATE.get_or_init(|| Mutex::new(None))
    }

    /// Одиночный символ клавиши → VK. Для '0'–'9' и 'A'–'Z' VK равен ASCII-
    /// коду заглавной буквы/цифры — покрывает use-case AHK ('4'/'6').
    fn key_to_vk(key: &str) -> Option<u16> {
        let mut chars = key.chars();
        let c = chars.next()?;
        if chars.next().is_some() {
            return None; // только одиночный символ
        }
        let up = c.to_ascii_uppercase();
        if up.is_ascii_alphanumeric() {
            Some(up as u16)
        } else {
            None
        }
    }

    fn wide_to_string(buf: &[u16]) -> String {
        let end = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
        String::from_utf16_lossy(&buf[..end])
    }

    /// Принадлежит ли процесс `pid` игре (`MechsEarth.exe`). Снимок процессов
    /// снимается только на замапленный клик — редкое событие, не на move.
    unsafe fn pid_is_game(pid: DWORD) -> bool {
        let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snapshot == INVALID_HANDLE_VALUE {
            return false;
        }
        let mut entry: PROCESSENTRY32W = std::mem::zeroed();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
        let mut found = false;
        if Process32FirstW(snapshot, &mut entry) != FALSE {
            loop {
                if entry.th32ProcessID == pid
                    && wide_to_string(&entry.szExeFile).eq_ignore_ascii_case(GAME_EXE)
                {
                    found = true;
                    break;
                }
                if Process32NextW(snapshot, &mut entry) == FALSE {
                    break;
                }
            }
        }
        CloseHandle(snapshot);
        found
    }

    /// HWND активного окна, если оно принадлежит игре; иначе None.
    unsafe fn foreground_game_hwnd() -> Option<HWND> {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return None;
        }
        let mut pid: DWORD = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == 0 {
            return None;
        }
        if pid_is_game(pid) {
            Some(hwnd)
        } else {
            None
        }
    }

    /// Шлёт нажатие клавиши в окно как WM_KEYDOWN+WM_KEYUP (тот же механизм,
    /// что AHK ControlSend — игра его понимает).
    unsafe fn post_key(hwnd: HWND, vk: u16) {
        let scan = MapVirtualKeyW(vk as u32, MAPVK_VK_TO_VSC);
        let l_down: LPARAM = (1 | (scan << 16)) as LPARAM;
        let l_up: LPARAM = (1 | (scan << 16) | (1 << 30) | (1 << 31)) as LPARAM;
        PostMessageW(hwnd, WM_KEYDOWN, vk as WPARAM, l_down);
        PostMessageW(hwnd, WM_KEYUP, vk as WPARAM, l_up);
    }

    /// Колбэк низкоуровневого хука. Дёшево отсеиваем немапленные события
    /// (в т.ч. move) до дорогой проверки активного окна.
    unsafe extern "system" fn ll_mouse_proc(
        code: c_int,
        wparam: WPARAM,
        lparam: LPARAM,
    ) -> LRESULT {
        if code == HC_ACTION {
            let trigger = match wparam as u32 {
                WM_XBUTTONDOWN => {
                    let info = &*(lparam as *const MSLLHOOKSTRUCT);
                    let xbtn = (info.mouseData >> 16) as u16;
                    if xbtn == XBUTTON1 {
                        Some(TRIGGER_XBUTTON1)
                    } else if xbtn == XBUTTON2 {
                        Some(TRIGGER_XBUTTON2)
                    } else {
                        None
                    }
                }
                WM_MBUTTONDOWN => Some(TRIGGER_MIDDLE),
                _ => None,
            };
            if let Some(t) = trigger {
                let vk = bindings().lock().ok().and_then(|m| m.get(&t).copied());
                if let Some(vk) = vk {
                    if let Some(hwnd) = foreground_game_hwnd() {
                        post_key(hwnd, vk);
                        return 1; // проглотить исходное событие (без двойного срабатывания)
                    }
                }
            }
        }
        CallNextHookEx(null_mut(), code, wparam, lparam)
    }

    pub fn start(bindings_in: Vec<MouseBinding>) -> Result<(), String> {
        let mut map = HashMap::new();
        for b in bindings_in {
            let trigger = match b.button.as_str() {
                "XButton1" => TRIGGER_XBUTTON1,
                "XButton2" => TRIGGER_XBUTTON2,
                "Middle" => TRIGGER_MIDDLE,
                other => return Err(format!("Неизвестная кнопка мыши: {}", other)),
            };
            let vk =
                key_to_vk(&b.key).ok_or_else(|| format!("Не удалось сопоставить клавишу: {}", b.key))?;
            map.insert(trigger, vk);
        }

        stop()?; // пересобираем маппинг с нуля — снимаем прежний хук, если был
        *bindings().lock().map_err(|_| "BINDINGS poisoned")? = map;

        // Поток с хуком и message-loop; thread_id возвращаем через канал для
        // последующего PostThreadMessage(WM_QUIT).
        let (tx, rx) = mpsc::channel::<Result<DWORD, String>>();
        let join = std::thread::spawn(move || unsafe {
            let hmod = GetModuleHandleW(null_mut());
            let hook: HHOOK = SetWindowsHookExW(WH_MOUSE_LL, Some(ll_mouse_proc), hmod, 0);
            if hook.is_null() {
                let _ = tx.send(Err("SetWindowsHookExW вернул NULL".to_string()));
                return;
            }
            let _ = tx.send(Ok(GetCurrentThreadId()));
            let mut msg: MSG = std::mem::zeroed();
            while GetMessageW(&mut msg, null_mut(), 0, 0) > 0 {} // WM_QUIT → выход
            UnhookWindowsHookEx(hook);
        });

        match rx.recv() {
            Ok(Ok(thread_id)) => {
                *state().lock().map_err(|_| "STATE poisoned")? = Some(HookState { thread_id, join });
                Ok(())
            }
            Ok(Err(e)) => {
                let _ = join.join();
                Err(e)
            }
            Err(_) => Err("Поток хука мыши завершился преждевременно".into()),
        }
    }

    pub fn stop() -> Result<(), String> {
        let taken = state().lock().map_err(|_| "STATE poisoned")?.take();
        if let Some(st) = taken {
            unsafe {
                PostThreadMessageW(st.thread_id, WM_QUIT, 0, 0);
            }
            let _ = st.join.join();
        }
        Ok(())
    }
}

#[cfg(test)]
mod settings_tests {
    use super::*;

    const SAMPLE: &str = concat!(
        "<?xml version=\"1.0\"?>\n",
        "<userDefaultRoot>\n",
        "<ResolutionWidth type=\"int\">1920</ResolutionWidth>\n",
        "<FullScreen type=\"bool\">false</FullScreen>\n",
        "<Keyboard:UseWeapon1 type=\"str\">1</Keyboard:UseWeapon1>\n",
        "<Game:Colors:MySet type=\"int\">255</Game:Colors:MySet>\n",
        "<LastEmail type=\"str\">a@b.c</LastEmail>\n",
        "<LicenseKey type=\"str\">deadbeef</LicenseKey>\n",
        "</userDefaultRoot>\n",
    );

    #[test]
    fn parses_colon_keys_types_and_order() {
        let e = parse_entries(SAMPLE);
        assert_eq!(e.len(), 6);
        assert_eq!(e[0].key, "ResolutionWidth");
        assert_eq!(e[0].typ, "int");
        assert_eq!(e[2].key, "Keyboard:UseWeapon1");
        assert_eq!(e[2].value, "1");
        assert_eq!(e[3].key, "Game:Colors:MySet");
    }

    #[test]
    fn apply_updates_preserves_others() {
        let mut u = HashMap::new();
        u.insert("ResolutionWidth".to_string(), "2560".to_string());
        let out = apply_updates(SAMPLE, &u);
        assert!(out.contains("<ResolutionWidth type=\"int\">2560</ResolutionWidth>"));
        assert!(out.contains("<Keyboard:UseWeapon1 type=\"str\">1</Keyboard:UseWeapon1>"));
        assert!(out.contains("<Game:Colors:MySet type=\"int\">255</Game:Colors:MySet>"));
    }

    #[test]
    fn registration_blank_removes_data_keeps_keys() {
        let out = apply_updates(SAMPLE, &registration_blank());
        assert!(out.contains("<LastEmail type=\"str\"></LastEmail>"));
        assert!(out.contains("<LicenseKey type=\"str\"></LicenseKey>"));
        assert!(!out.contains("a@b.c"));
        assert!(!out.contains("deadbeef"));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_windows,
            capture_window,
            find_inventory_corner,
            debug_visualize_corner,
            write_file_base64,
            find_latest_game,
            launch_game,
            close_all_games,
            list_game_windows,
            launch_and_arrange,
            read_game_settings,
            write_game_settings,
            restore_game_settings,
            strip_registration,
            open_game_folder,
            start_mouse_remap,
            stop_mouse_remap,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
