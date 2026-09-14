//! Local file validation and native file dialog integration for HoverTV.
//! Structured log format: [RUST:file_handler:FUNCTION]

use std::path::Path;
use tauri::{command, AppHandle, Emitter};
use tauri_plugin_dialog::DialogExt;

use crate::log_error;
use crate::log_info;
use crate::log_warn;

const SUPPORTED_EXTENSIONS: &[&str] = &["mp4", "webm"];

/// Validates that the path points to a supported video file (.mp4 or .webm).
pub fn validate_video_path(path: &Path) -> Result<(), String> {
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_ascii_lowercase())
        .ok_or_else(|| {
            let msg = format!("File has no extension: {}", path.display());
            log_warn!("file_handler", "validate_video_path", "{}", msg);
            msg
        })?;

    if SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
        log_info!("file_handler", "validate_video_path", "Valid video file: {}", path.display());
        Ok(())
    } else {
        let msg = format!("Unsupported video format '.{}'. Supported formats: mp4, webm", ext);
        log_warn!("file_handler", "validate_video_path", "{}", msg);
        Err(msg)
    }
}

/// Invokes native OS file picker dialog filtered to .mp4 and .webm videos.
/// Emits 'local-file-opened' event to frontend if a valid file was selected.
#[command]
pub fn open_file_dialog(app_handle: AppHandle) -> Result<Option<String>, String> {
    log_info!("file_handler", "open_file_dialog", "Opening native file picker dialog");

    let file_path = app_handle
        .dialog()
        .file()
        .add_filter("Supported Video Files", SUPPORTED_EXTENSIONS)
        .blocking_pick_file();

    match file_path {
        Some(path_buf) => {
            let path = path_buf.into_path().map_err(|e| e.to_string())?;
            validate_video_path(&path)?;

            let path_str = path.to_string_lossy().to_string();
            let file_name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Local Video".to_string());

            let payload = serde_json::json!({
                "path": path_str,
                "title": file_name,
            });

            if let Err(err) = app_handle.emit("local-file-opened", &payload) {
                log_error!("file_handler", "open_file_dialog", "Failed to emit event: {}", err);
                return Err(format!("Failed to emit local-file-opened: {}", err));
            }

            log_info!("file_handler", "open_file_dialog", "Successfully opened file: {}", path_str);
            Ok(Some(path_str))
        }
        None => {
            log_info!("file_handler", "open_file_dialog", "File picker cancelled by user");
            Ok(None)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_validate_accepts_mp4_and_webm() {
        assert!(validate_video_path(&PathBuf::from("test.mp4")).is_ok());
        assert!(validate_video_path(&PathBuf::from("video.webm")).is_ok());
        assert!(validate_video_path(&PathBuf::from("UPPERCASE.MP4")).is_ok());
        assert!(validate_video_path(&PathBuf::from("UPPERCASE.WEBM")).is_ok());
    }

    #[test]
    fn test_validate_rejects_unsupported() {
        assert!(validate_video_path(&PathBuf::from("test.avi")).is_err());
        assert!(validate_video_path(&PathBuf::from("test.mkv")).is_err());
        assert!(validate_video_path(&PathBuf::from("image.png")).is_err());
        assert!(validate_video_path(&PathBuf::from("file_without_ext")).is_err());
    }

    #[test]
    fn test_validate_mixed_case() {
        assert!(validate_video_path(&PathBuf::from("my_movie.Mp4")).is_ok());
        assert!(validate_video_path(&PathBuf::from("clip.WebM")).is_ok());
    }

    #[test]
    fn test_validate_empty_and_special_paths() {
        assert!(validate_video_path(&PathBuf::from("")).is_err());
        assert!(validate_video_path(&PathBuf::from(".mp4")).is_err());
        assert!(validate_video_path(&PathBuf::from("archive.tar.gz")).is_err());
    }
}
