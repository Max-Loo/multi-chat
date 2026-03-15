/**
 * Tauri Transport
 *
 * 将日志发送到 Rust 后端写入文件
 */

import { invoke } from '@tauri-apps/api/core';
import type { Transport, LogEntry } from '../types';

/**
 * Tauri Transport 实现
 */
export class TauriTransport implements Transport {
  private enabled: boolean = true;

  constructor() {
    // 检查是否在 Tauri 环境中
    this.enabled = typeof window !== 'undefined' && '__TAURI__' in window;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await invoke('log_write', {
        entry: {
          level: entry.level,
          message: entry.message,
          context: entry.context,
          source: entry.source,
        },
      });
    } catch (error) {
      // 如果写入失败，输出到控制台（避免循环）
      console.error('[Logger] Failed to write log via Tauri:', error);
    }
  }

  /**
   * 批量写入日志
   * 通过单次 IPC 调用发送多条日志，减少通信开销
   * @param entries 日志条目数组
   */
  async writeBatch(entries: LogEntry[]): Promise<void> {
    if (!this.enabled || entries.length === 0) {
      return;
    }

    try {
      await invoke('log_write_batch', {
        entries: entries.map((entry) => ({
          level: entry.level,
          message: entry.message,
          context: entry.context,
          source: entry.source,
        })),
      });
    } catch (error) {
      // 如果批量写入失败，输出到控制台（避免循环）
      console.error('[Logger] Failed to write batch logs via Tauri:', error);
    }
  }
}
