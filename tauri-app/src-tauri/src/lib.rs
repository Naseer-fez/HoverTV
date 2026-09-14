mod logging;
pub mod file_handler;
pub mod messages;
pub mod native_messaging;
pub mod state;

use state::AppState;
use tauri::Emitter;

fn handle_drag_drop(window: &tauri::Window, paths: &[std::path::PathBuf]) {
    for path in paths {
        if file_handler::validate_video_path(path).is_ok() {
            let path_str = path.to_string_lossy().to_string();
            let file_name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Local Video".to_string());

            log_info!("lib", "handle_drag_drop", "Accepting dropped file: {}", path_str);
            let payload = serde_json::json!({
                "path": path_str,
                "title": file_name,
            });

            if let Err(err) = window.emit("local-file-opened", &payload) {
                log_error!("lib", "handle_drag_drop", "Failed to emit local-file-opened: {}", err);
            }
            break;
        }
    }
}

pub fn run() {
    log_info!("lib", "run", "Starting HoverTV application");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            state::toggle_always_on_top,
            state::get_always_on_top,
            state::set_volume,
            state::get_volume,
            state::set_power_state,
            state::get_power_state,
            state::close_tv_window,
            state::exit_app,
            file_handler::open_file_dialog,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, .. }) = event {
                handle_drag_drop(window, paths);
            }
        })
        .setup(|app| {
            log_info!("lib", "setup", "Initializing native messaging bridge");
            native_messaging::start_native_messaging_listener(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running HoverTV application");
}
