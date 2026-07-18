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
use std::io::Cursor;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
