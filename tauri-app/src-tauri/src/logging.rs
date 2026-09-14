//! Structured logging for HoverTV Rust backend.
//! Enforces format: [RUST:module:function] message

#[macro_export]
macro_rules! log_info {
    ($module:expr, $func:expr, $($arg:tt)*) => {
        println!("[RUST:{}:{}] {}", $module, $func, format_args!($($arg)*))
    };
}

#[macro_export]
macro_rules! log_warn {
    ($module:expr, $func:expr, $($arg:tt)*) => {
        eprintln!("[RUST:{}:{}] WARN: {}", $module, $func, format_args!($($arg)*))
    };
}

#[macro_export]
macro_rules! log_error {
    ($module:expr, $func:expr, $($arg:tt)*) => {
        eprintln!("[RUST:{}:{}] ERROR: {}", $module, $func, format_args!($($arg)*))
    };
}
