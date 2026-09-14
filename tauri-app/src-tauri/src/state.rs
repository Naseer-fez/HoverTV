use std::sync::Mutex;
use tauri::{command, State, Window};

use crate::log_info;
use crate::log_error;

pub struct AppState {
    pub always_on_top: Mutex<bool>,
    pub volume: Mutex<f32>,
    pub power_on: Mutex<bool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            always_on_top: Mutex::new(true),
            volume: Mutex::new(0.8),
            power_on: Mutex::new(true),
        }
    }
}

#[command]
pub fn toggle_always_on_top(window: Window, state: State<'_, AppState>) -> Result<bool, String> {
    let mut lock = state.always_on_top.lock().map_err(|e| e.to_string())?;
    let new_val = !*lock;
    
    if let Err(err) = window.set_always_on_top(new_val) {
        log_error!("state", "toggle_always_on_top", "Failed to set always on top: {}", err);
        return Err(err.to_string());
    }
    
    *lock = new_val;
    log_info!("state", "toggle_always_on_top", "Always on top set to: {}", new_val);
    Ok(new_val)
}

#[command]
pub fn get_always_on_top(state: State<'_, AppState>) -> Result<bool, String> {
    let lock = state.always_on_top.lock().map_err(|e| e.to_string())?;
    log_info!("state", "get_always_on_top", "Current always on top: {}", *lock);
    Ok(*lock)
}

#[command]
pub fn set_volume(level: f32, state: State<'_, AppState>) -> Result<(), String> {
    let clamped = level.clamp(0.0, 1.0);
    let mut lock = state.volume.lock().map_err(|e| e.to_string())?;
    *lock = clamped;
    log_info!("state", "set_volume", "Volume updated to: {:.2}", clamped);
    Ok(())
}

#[command]
pub fn get_volume(state: State<'_, AppState>) -> Result<f32, String> {
    let lock = state.volume.lock().map_err(|e| e.to_string())?;
    log_info!("state", "get_volume", "Current volume: {:.2}", *lock);
    Ok(*lock)
}

#[command]
pub fn set_power_state(power_on: bool, state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.power_on.lock().map_err(|e| e.to_string())?;
    *lock = power_on;
    log_info!("state", "set_power_state", "Power state updated: {}", power_on);
    Ok(())
}

#[command]
pub fn get_power_state(state: State<'_, AppState>) -> Result<bool, String> {
    let lock = state.power_on.lock().map_err(|e| e.to_string())?;
    log_info!("state", "get_power_state", "Current power state: {}", *lock);
    Ok(*lock)
}

#[command]
pub fn close_tv_window(window: Window) -> Result<(), String> {
    log_info!("state", "close_tv_window", "Closing TV window");
    window.close().map_err(|e| e.to_string())
}

#[command]
pub fn exit_app(app_handle: tauri::AppHandle) -> Result<(), String> {
    log_info!("state", "exit_app", "Exiting HoverTV application");
    app_handle.exit(0);
    Ok(())
}
