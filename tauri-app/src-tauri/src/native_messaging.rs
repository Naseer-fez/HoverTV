use std::io::{self, Read, Write};
use tauri::{AppHandle, Emitter};

use crate::log_error;
use crate::log_info;
use crate::messages::{AppMessage, ExtensionMessage};

/// Reads a length-prefixed JSON message from a reader per Chrome Native Messaging protocol.
pub fn read_nm_message<R: Read>(reader: &mut R) -> Result<Option<ExtensionMessage>, String> {
    let mut length_buf = [0u8; 4];
    match reader.read_exact(&mut length_buf) {
        Ok(()) => {}
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(format!("failed to read length prefix: {}", e)),
    }

    let length = u32::from_ne_bytes(length_buf) as usize;
    if length == 0 || length > 10 * 1024 * 1024 {
        return Err(format!("invalid message length: {} bytes", length));
    }

    let mut message_buf = vec![0u8; length];
    reader
        .read_exact(&mut message_buf)
        .map_err(|e| format!("failed to read message body: {}", e))?;

    let message: ExtensionMessage = serde_json::from_slice(&message_buf)
        .map_err(|e| format!("failed to deserialize JSON payload: {}", e))?;

    Ok(Some(message))
}

/// Writes a length-prefixed JSON message to a writer per Chrome Native Messaging protocol.
pub fn write_nm_message<W: Write>(writer: &mut W, msg: &AppMessage) -> Result<(), String> {
    let json_bytes = serde_json::to_vec(msg)
        .map_err(|e| format!("failed to serialize AppMessage: {}", e))?;

    let length = json_bytes.len() as u32;
    writer
        .write_all(&length.to_ne_bytes())
        .map_err(|e| format!("failed to write length prefix: {}", e))?;

    writer
        .write_all(&json_bytes)
        .map_err(|e| format!("failed to write JSON bytes: {}", e))?;

    writer
        .flush()
        .map_err(|e| format!("failed to flush stdout: {}", e))?;

    Ok(())
}

/// Starts the native messaging background listener thread reading stdin.
pub fn start_native_messaging_listener(app_handle: AppHandle) {
    std::thread::spawn(move || {
        log_info!("native_messaging", "start_listener", "Native messaging thread started");
        let stdin = io::stdin();
        let mut reader = stdin.lock();

        let stdout = io::stdout();
        let mut writer = stdout.lock();

        // Send initial READY handshake
        if let Err(err) = write_nm_message(&mut writer, &AppMessage::READY) {
            log_error!("native_messaging", "start_listener", "Failed to send READY: {}", err);
        }

        loop {
            match read_nm_message(&mut reader) {
                Ok(Some(msg)) => {
                    log_info!("native_messaging", "handle_stdin", "Received message: {:?}", msg);
                    if let Err(err) = app_handle.emit("nm-message", &msg) {
                        log_error!("native_messaging", "handle_stdin", "Failed to emit Tauri event: {}", err);
                    }
                }
                Ok(None) => {
                    log_info!("native_messaging", "handle_stdin", "Native messaging stdin EOF reached");
                    break;
                }
                Err(err) => {
                    log_error!("native_messaging", "handle_stdin", "NM message processing failed | {}", err);
                    break;
                }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn test_write_and_read_roundtrip() {
        let msg = AppMessage::STATUS { status: "playing".into() };
        let mut buffer = Vec::new();
        assert!(write_nm_message(&mut buffer, &msg).is_ok());

        assert!(buffer.len() > 4);
        let len = u32::from_ne_bytes(buffer[0..4].try_into().unwrap()) as usize;
        assert_eq!(len, buffer.len() - 4);
    }

    #[test]
    fn test_read_play_url_message() {
        let json = r#"{"type":"PLAY_URL","url":"https://example.com/video.mp4","source":"html5"}"#;
        let len = (json.len() as u32).to_ne_bytes();
        let mut raw = Vec::new();
        raw.extend_from_slice(&len);
        raw.extend_from_slice(json.as_bytes());

        let mut cursor = Cursor::new(raw);
        let parsed = read_nm_message(&mut cursor).expect("failed to parse message");
        assert!(parsed.is_some());
        match parsed.unwrap() {
            ExtensionMessage::PLAY_URL { url, source, .. } => {
                assert_eq!(url, "https://example.com/video.mp4");
                assert_eq!(source, "html5");
            }
            _ => panic!("Expected PLAY_URL variant"),
        }
    }

    #[test]
    fn test_read_unexpected_eof() {
        let mut cursor = Cursor::new(Vec::<u8>::new());
        let result = read_nm_message(&mut cursor).expect("should handle eof");
        assert!(result.is_none());
    }

    #[test]
    fn test_read_invalid_json() {
        let bad_json = b"{\"type\":\"UNKNOWN_OR_MALFORMED\"}";
        let len = (bad_json.len() as u32).to_ne_bytes();
        let mut raw = Vec::new();
        raw.extend_from_slice(&len);
        raw.extend_from_slice(bad_json);

        let mut cursor = Cursor::new(raw);
        let result = read_nm_message(&mut cursor);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("failed to deserialize"));
    }

    #[test]
    fn test_read_truncated_body() {
        let mut raw = Vec::new();
        raw.extend_from_slice(&(100u32).to_ne_bytes()); // Claims 100 bytes
        raw.extend_from_slice(b"{\"type\":\"PLAY_URL\"}"); // Only ~18 bytes provided

        let mut cursor = Cursor::new(raw);
        let result = read_nm_message(&mut cursor);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("failed to read message body"));
    }

    #[test]
    fn test_read_oversized_length() {
        let mut raw = Vec::new();
        let oversized = (15 * 1024 * 1024u32).to_ne_bytes(); // 15MB > 10MB limit
        raw.extend_from_slice(&oversized);

        let mut cursor = Cursor::new(raw);
        let result = read_nm_message(&mut cursor);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("invalid message length"));
    }

    #[test]
    fn test_read_zero_length() {
        let mut raw = Vec::new();
        raw.extend_from_slice(&(0u32).to_ne_bytes());

        let mut cursor = Cursor::new(raw);
        let result = read_nm_message(&mut cursor);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("invalid message length"));
    }

    #[test]
    fn test_read_sync_state_message() {
        let json = r#"{"type":"SYNC_STATE","state":"pause"}"#;
        let len = (json.len() as u32).to_ne_bytes();
        let mut raw = Vec::new();
        raw.extend_from_slice(&len);
        raw.extend_from_slice(json.as_bytes());

        let mut cursor = Cursor::new(raw);
        let parsed = read_nm_message(&mut cursor).expect("failed to parse sync_state");
        match parsed.unwrap() {
            ExtensionMessage::SYNC_STATE { state } => assert_eq!(state, "pause"),
            _ => panic!("Expected SYNC_STATE variant"),
        }
    }

    #[test]
    fn test_read_source_lost_message() {
        let json = r#"{"type":"SOURCE_LOST"}"#;
        let len = (json.len() as u32).to_ne_bytes();
        let mut raw = Vec::new();
        raw.extend_from_slice(&len);
        raw.extend_from_slice(json.as_bytes());

        let mut cursor = Cursor::new(raw);
        let parsed = read_nm_message(&mut cursor).expect("failed to parse source_lost");
        match parsed.unwrap() {
            ExtensionMessage::SOURCE_LOST => {}
            _ => panic!("Expected SOURCE_LOST variant"),
        }
    }

    #[test]
    fn test_write_ready_message() {
        let mut buffer = Vec::new();
        assert!(write_nm_message(&mut buffer, &AppMessage::READY).is_ok());

        assert!(buffer.len() > 4);
        let len = u32::from_ne_bytes(buffer[0..4].try_into().unwrap()) as usize;
        let body = std::str::from_utf8(&buffer[4..4 + len]).expect("valid utf-8");
        assert_eq!(body, r#"{"type":"READY"}"#);
    }

    #[test]
    fn test_roundtrip_all_app_message_variants() {
        let variants = vec![
            AppMessage::READY,
            AppMessage::STATUS { status: "playing".into() },
            AppMessage::STATUS { status: "paused".into() },
            AppMessage::STATUS { status: "static".into() },
            AppMessage::STATUS { status: "off".into() },
        ];

        for variant in variants {
            let mut buffer = Vec::new();
            assert!(write_nm_message(&mut buffer, &variant).is_ok());
            let len = u32::from_ne_bytes(buffer[0..4].try_into().unwrap()) as usize;
            assert_eq!(len, buffer.len() - 4);
        }
    }
}
