//! 日志配置模块
//!
//! 定义日志系统的配置常量

use std::path::PathBuf;

/// 日志文件名前缀
pub const LOG_FILE_PREFIX: &str = "multi-chat";

/// 日志文件扩展名
pub const LOG_FILE_EXTENSION: &str = "log";

/// 日志保留天数
pub const RETENTION_DAYS: u64 = 30;

/// 获取日志目录路径
///
/// 返回日志文件存储目录
/// - macOS: ~/Library/Logs/multi-chat/
/// - Windows: %APPDATA%/multi-chat/logs/
/// - Linux: ~/.local/share/multi-chat/logs/
pub fn get_log_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("multi-chat")
        .join("logs")
}
