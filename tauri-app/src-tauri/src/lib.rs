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

const IPC_PORT: u16 = 54321;

fn run_as_relay() {
    crate::log_info!("lib", "run_as_relay", "Starting as lightweight relay");
    
    let mut stream = match std::net::TcpStream::connect(("127.0.0.1", IPC_PORT)) {
        Ok(s) => s,
        Err(e) => {
            crate::log_error!("lib", "run_as_relay", "Failed to connect to primary instance: {}", e);
            return;
        }
    };
    
    // Send READY to our stdout so Chrome knows we are ready
    let mut stdout = std::io::stdout().lock();
    if let Err(e) = native_messaging::write_nm_message(&mut stdout, &messages::AppMessage::READY) {
        crate::log_error!("lib", "run_as_relay", "Failed to send READY: {}", e);
    }
    
    let mut stdin = std::io::stdin().lock();
    use std::io::Write;
    loop {
        match native_messaging::read_nm_message(&mut stdin) {
            Ok(Some(msg)) => {
                crate::log_info!("lib", "run_as_relay", "Relaying message: {:?}", msg);
                let json = serde_json::to_vec(&msg).unwrap();
                let len = (json.len() as u32).to_ne_bytes();
                if stream.write_all(&len).is_err() || stream.write_all(&json).is_err() || stream.flush().is_err() {
                    break;
                }
            }
            Ok(None) => break,
            Err(e) => {
                crate::log_error!("lib", "run_as_relay", "Error reading from stdin: {}", e);
                break;
            }
        }
    }
}

fn start_ipc_server(app_handle: tauri::AppHandle, listener: std::net::TcpListener) {
    std::thread::spawn(move || {
        crate::log_info!("lib", "start_ipc_server", "Listening for relays on port {}", IPC_PORT);
        for stream in listener.incoming() {
            if let Ok(mut stream) = stream {
                let handle = app_handle.clone();
                std::thread::spawn(move || {
                    loop {
                        match native_messaging::read_nm_message(&mut stream) {
                            Ok(Some(msg)) => {
                                crate::log_info!("lib", "ipc_server", "Received message from relay: {:?}", msg);
                                if let Err(err) = handle.emit("nm-message", &msg) {
                                    crate::log_error!("lib", "ipc_server", "Failed to emit Tauri event: {}", err);
                                }
                            }
                            Ok(None) => break,
                            Err(e) => {
                                crate::log_error!("lib", "ipc_server", "Relay message processing failed: {}", e);
                                break;
                            }
                        }
                    }
                });
            }
        }
    });
}

pub fn run() {
    crate::log_info!("lib", "run", "Starting HoverTV application");

    let listener = match std::net::TcpListener::bind(("127.0.0.1", IPC_PORT)) {
        Ok(l) => l,
        Err(_) => {
            run_as_relay();
            return;
        }
    };

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
            crate::log_info!("lib", "setup", "Initializing native messaging bridge");
            native_messaging::start_native_messaging_listener(app.handle().clone());
            start_ipc_server(app.handle().clone(), listener);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running HoverTV application");
}
