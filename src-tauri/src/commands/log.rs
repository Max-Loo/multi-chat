//! 日志相关 Tauri 命令
//!
//! 提供日志写入、导出、清除和状态查询功能

use std::fs;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::State;
use time::OffsetDateTime;

use crate::logging::{cleanup_old_logs, get_log_dir, get_log_status, LogStatus, LogWriter};

/// 获取日志目录路径
#[tauri::command]
pub async fn get_log_dir_path() -> String {
    get_log_dir().to_string_lossy().to_string()
}

/// 日志条目结构
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct LogEntry {
    /// 日志级别
    pub level: String,
    /// 日志消息
    pub message: String,
    /// 上下文信息
    #[serde(default)]
    pub context: Option<serde_json::Value>,
    /// 来源 (frontend/backend)
    #[serde(default = "default_source")]
    pub source: String,
}

fn default_source() -> String {
    "frontend".to_string()
}

/// 日志清除结果
#[derive(Debug, Clone, Serialize)]
pub struct LogClearResult {
    /// 删除的文件数
    pub deleted_files: u32,
    /// 释放的空间（字节）
    pub freed_bytes: u64,
}

/// 应用状态中的日志写入器
pub struct LogWriterState {
    pub writer: Mutex<LogWriter>,
}

/// 写入日志
#[tauri::command]
pub async fn log_write(entry: LogEntry, state: State<'_, LogWriterState>) -> Result<(), String> {
    let log_line = serde_json::to_string(&entry)
        .map_err(|e| format!("Failed to serialize log entry: {}", e))?;

    let mut writer = state
        .writer
        .lock()
        .map_err(|_| "Failed to acquire log writer lock".to_string())?;

    writer
        .write_line(&log_line)
        .map_err(|e| format!("Failed to write log: {}", e))?;

    Ok(())
}

/// 批量写入日志
#[tauri::command]
pub async fn log_write_batch(entries: Vec<LogEntry>, state: State<'_, LogWriterState>) -> Result<(), String> {
    let mut writer = state
        .writer
        .lock()
        .map_err(|_| "Failed to acquire log writer lock".to_string())?;

    for entry in entries {
        let log_line = serde_json::to_string(&entry)
            .map_err(|e| format!("Failed to serialize log entry: {}", e))?;

        writer
            .write_line(&log_line)
            .map_err(|e| format!("Failed to write log: {}", e))?;
    }

    Ok(())
}

/// 导出日志
///
/// # Arguments
/// * `_format` - 导出格式（预留，当前仅支持 JSON）
/// * `max_entries` - 最大导出条目数，默认 10000，防止内存溢出
#[tauri::command]
pub async fn log_export(_format: Option<String>, max_entries: Option<usize>) -> Result<String, String> {
    let max_entries = max_entries.unwrap_or(10000);
    let log_dir = get_log_dir();

    if !log_dir.exists() {
        return Err("No logs to export".to_string());
    }

    // 收集日志条目，限制最大数量防止内存溢出
    let mut all_entries: Vec<serde_json::Value> = Vec::with_capacity(max_entries.min(1000));

    for entry in fs::read_dir(&log_dir)
        .map_err(|e| format!("Failed to read log directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "log") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read log file: {}", e))?;

            for line in content.lines() {
                if all_entries.len() >= max_entries {
                    break;
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                    all_entries.push(json);
                }
            }
        }

        if all_entries.len() >= max_entries {
            break;
        }
    }

    if all_entries.is_empty() {
        return Err("No logs to export".to_string());
    }

    // 按时间戳排序
    all_entries.sort_by(|a, b| {
        let ts_a = a.get("timestamp").and_then(|t| t.as_str()).unwrap_or("");
        let ts_b = b.get("timestamp").and_then(|t| t.as_str()).unwrap_or("");
        ts_a.cmp(ts_b)
    });

    // 生成导出文件
    let now = OffsetDateTime::now_utc();
    let date_str = format!("{:04}-{:02}-{:02}", now.year(), now.month() as u8, now.day());
    let export_path = log_dir.join(format!("multi-chat-logs-{}.json", date_str));

    let json_output = serde_json::to_string_pretty(&all_entries)
        .map_err(|e| format!("Failed to serialize logs: {}", e))?;

    fs::write(&export_path, json_output)
        .map_err(|e| format!("Failed to write export file: {}", e))?;

    Ok(export_path.to_string_lossy().to_string())
}

/// 清除所有日志
#[tauri::command]
pub async fn log_clear() -> Result<LogClearResult, String> {
    let log_dir = get_log_dir();

    // 先执行过期日志清理
    let (deleted_files, freed_bytes) = cleanup_old_logs(&log_dir)
        .map_err(|e| format!("Failed to cleanup logs: {}", e))?;

    // 删除所有剩余的日志文件（不只是过期的）
    let mut extra_deleted = 0u32;
    let mut extra_freed = 0u64;

    if log_dir.exists() {
        for entry in fs::read_dir(&log_dir)
            .map_err(|e| format!("Failed to read log directory: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            if path.extension().map_or(false, |ext| ext == "log") {
                if let Ok(metadata) = entry.metadata() {
                    extra_freed += metadata.len();
                }
                if fs::remove_file(&path).is_ok() {
                    extra_deleted += 1;
                }
            }
        }
    }

    Ok(LogClearResult {
        deleted_files: deleted_files + extra_deleted,
        freed_bytes: freed_bytes + extra_freed,
    })
}

/// 获取日志状态
#[tauri::command]
pub async fn log_status() -> Result<LogStatus, String> {
    let log_dir = get_log_dir();

    get_log_status(&log_dir).map_err(|e| format!("Failed to get log status: {}", e))
}

/// 执行日志清理（用于启动时调用）
#[tauri::command]
pub async fn log_cleanup() -> Result<LogClearResult, String> {
    let log_dir = get_log_dir();

    let (deleted_files, freed_bytes) = cleanup_old_logs(&log_dir)
        .map_err(|e| format!("Failed to cleanup logs: {}", e))?;

    Ok(LogClearResult {
        deleted_files,
        freed_bytes,
    })
}
