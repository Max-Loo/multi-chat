//! 日志模块
//!
//! 提供本地日志采集和管理功能

pub mod config;
pub mod writer;

pub use config::get_log_dir;
pub use writer::{cleanup_old_logs, get_log_status, LogStatus, LogWriter};
