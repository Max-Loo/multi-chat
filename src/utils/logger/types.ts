/**
 * 日志模块类型定义
 */

/**
 * 日志级别
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * 日志条目
 */
export interface LogEntry {
  /** ISO 8601 格式时间戳 */
  timestamp: string;
  /** 日志级别 */
  level: LogLevel;
  /** 来源 (frontend/backend) */
  source: 'frontend' | 'backend';
  /** 日志消息 */
  message: string;
  /** 上下文信息 */
  context?: Record<string, unknown>;
}

/**
 * 日志状态
 */
export interface LogStatus {
  /** 日志文件总大小（字节） */
  totalSizeBytes: number;
  /** 日志文件数量 */
  fileCount: number;
  /** 最早日志日期 */
  oldestDate: string | null;
  /** 最新日志日期 */
  newestDate: string | null;
  /** 保留天数 */
  retentionDays: number;
}

/**
 * 日志清除结果
 */
export interface LogClearResult {
  /** 删除的文件数 */
  deletedFiles: number;
  /** 释放的空间（字节） */
  freedBytes: number;
}

/**
 * Logger 配置
 */
export interface LoggerConfig {
  /** 模块名称 */
  module?: string;
  /** 默认上下文 */
  context?: Record<string, unknown>;
}

/**
 * Transport 接口
 */
export interface Transport {
  /** 写入单条日志 */
  write(entry: LogEntry): Promise<void>;
  /** 批量写入日志（可选，默认逐条调用 write） */
  writeBatch?(entries: LogEntry[]): Promise<void>;
  /** 是否启用 */
  isEnabled(): boolean;
}
