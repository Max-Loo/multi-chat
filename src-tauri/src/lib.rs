// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod commands;
mod logging;

use commands::{get_log_dir_path, log_cleanup, log_clear, log_export, log_status, log_write, log_write_batch, LogWriterState};
use logging::{get_log_dir, LogWriter};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志目录
    let log_dir = get_log_dir();
    if !log_dir.exists() {
        let _ = std::fs::create_dir_all(&log_dir);
    }

    // 创建日志写入器状态
    let log_writer = LogWriterState {
        writer: std::sync::Mutex::new(LogWriter::new(log_dir)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_fs::init())
        .manage(log_writer)
        .invoke_handler(tauri::generate_handler![
            log_write,
            log_write_batch,
            log_export,
            log_clear,
            log_status,
            log_cleanup,
            get_log_dir_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
