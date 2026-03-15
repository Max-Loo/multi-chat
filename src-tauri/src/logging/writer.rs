//! 日志文件写入器
//!
//! 提供按天轮转的日志文件写入功能

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use time::OffsetDateTime;

use super::config::{LOG_FILE_EXTENSION, LOG_FILE_PREFIX, RETENTION_DAYS};

/// 日志写入器
pub struct LogWriter {
    log_dir: PathBuf,
    current_file: Option<File>,
    current_date: Option<String>,
}

impl LogWriter {
    pub fn new(log_dir: PathBuf) -> Self {
        // 确保日志目录存在
        if !log_dir.exists() {
            let _ = fs::create_dir_all(&log_dir);
        }

        Self {
            log_dir,
            current_file: None,
            current_date: None,
        }
    }

    /// 获取当前日期字符串 (YYYY-MM-DD)
    fn get_current_date() -> String {
        let now = OffsetDateTime::now_utc();
        format!("{:04}-{:02}-{:02}", now.year(), now.month() as u8, now.day())
    }

    /// 获取当前日志文件路径
    fn get_current_log_path(&self) -> PathBuf {
        self.log_dir.join(format!("{}.{}", LOG_FILE_PREFIX, LOG_FILE_EXTENSION))
    }

    /// 确保文件已打开且是当天的
    fn ensure_file_open(&mut self) -> std::io::Result<&mut File> {
        let today = Self::get_current_date();

        // 检查是否需要轮转（日期变更）
        if self.current_date.as_ref() != Some(&today) {
            // 轮转旧文件
            if self.current_file.is_some() {
                self.current_file = None;
                self.rotate_old_file()?;
            }

            // 打开新文件
            let path = self.get_current_log_path();
            let file = OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)?;

            self.current_file = Some(file);
            self.current_date = Some(today);
        }

        Ok(self.current_file.as_mut().unwrap())
    }

    /// 轮转旧日志文件
    fn rotate_old_file(&mut self) -> std::io::Result<()> {
        let current_path = self.get_current_log_path();
        if current_path.exists() {
            // 检查文件大小，只有非空文件才轮转
            let metadata = fs::metadata(&current_path)?;
            if metadata.len() > 0 {
                let date = self.current_date.clone().unwrap_or_else(|| Self::get_current_date());
                let rotated_path = self.log_dir.join(format!("{}.{}.{}", LOG_FILE_PREFIX, date, LOG_FILE_EXTENSION));

                // 如果目标文件已存在，添加序号
                let final_path = if rotated_path.exists() {
                    let mut counter = 1;
                    loop {
                        let path_with_suffix = self.log_dir.join(format!(
                            "{}.{}.{}.{}",
                            LOG_FILE_PREFIX, date, counter, LOG_FILE_EXTENSION
                        ));
                        if !path_with_suffix.exists() {
                            break path_with_suffix;
                        }
                        counter += 1;
                    }
                } else {
                    rotated_path
                };

                fs::rename(&current_path, &final_path)?;
            }
        }
        Ok(())
    }

    /// 写入日志行
    pub fn write_line(&mut self, line: &str) -> std::io::Result<()> {
        let file = self.ensure_file_open()?;
        writeln!(file, "{}", line)?;
        file.flush()?; // 立即 flush 确保日志不丢失
        Ok(())
    }
}

/// 清理过期日志文件
pub fn cleanup_old_logs(log_dir: &PathBuf) -> std::io::Result<(u32, u64)> {
    let mut deleted_count = 0u32;
    let mut freed_bytes = 0u64;

    if !log_dir.exists() {
        return Ok((deleted_count, freed_bytes));
    }

    let now = OffsetDateTime::now_utc();
    let retention_seconds = RETENTION_DAYS * 24 * 60 * 60;

    for entry in fs::read_dir(log_dir)? {
        let entry = entry?;
        let path = entry.path();

        // 只处理日志文件
        if path.extension().map_or(false, |ext| ext == LOG_FILE_EXTENSION) {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    let modified: OffsetDateTime = modified.into();
                    let age_seconds = (now - modified).whole_seconds() as u64;

                    if age_seconds > retention_seconds {
                        let file_size = metadata.len();
                        if fs::remove_file(&path).is_ok() {
                            deleted_count += 1;
                            freed_bytes += file_size;
                        }
                    }
                }
            }
        }
    }

    Ok((deleted_count, freed_bytes))
}

/// 获取日志目录状态
pub fn get_log_status(log_dir: &PathBuf) -> std::io::Result<LogStatus> {
    let mut total_size = 0u64;
    let mut file_count = 0u32;
    let mut oldest_date: Option<String> = None;
    let mut newest_date: Option<String> = None;

    if !log_dir.exists() {
        return Ok(LogStatus {
            total_size_bytes: 0,
            file_count: 0,
            oldest_date: None,
            newest_date: None,
            retention_days: RETENTION_DAYS,
        });
    }

    for entry in fs::read_dir(log_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == LOG_FILE_EXTENSION) {
            if let Ok(metadata) = entry.metadata() {
                total_size += metadata.len();
                file_count += 1;

                // 从文件名提取日期
                if let Some(filename) = path.file_stem().and_then(|s| s.to_str()) {
                    // 文件名格式: multi-chat 或 multi-chat.2026-03-15
                    if let Some(date_part) = filename.strip_prefix(&format!("{}.", LOG_FILE_PREFIX)) {
                        if oldest_date.is_none() || date_part < oldest_date.as_ref().unwrap().as_str() {
                            oldest_date = Some(date_part.to_string());
                        }
                        if newest_date.is_none() || date_part > newest_date.as_ref().unwrap().as_str() {
                            newest_date = Some(date_part.to_string());
                        }
                    }
                }
            }
        }
    }

    Ok(LogStatus {
        total_size_bytes: total_size,
        file_count,
        oldest_date,
        newest_date,
        retention_days: RETENTION_DAYS,
    })
}

/// 日志状态结构
#[derive(Debug, Clone, serde::Serialize)]
pub struct LogStatus {
    pub total_size_bytes: u64,
    pub file_count: u32,
    pub oldest_date: Option<String>,
    pub newest_date: Option<String>,
    pub retention_days: u64,
}
