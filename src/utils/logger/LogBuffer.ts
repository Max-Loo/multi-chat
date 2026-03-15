/**
 * 日志缓冲器
 *
 * 批量发送日志，减少 IPC 调用开销
 * - 每 100ms 或累积 10 条日志时批量发送
 */

import type { LogEntry } from './types';

/** 缓冲配置 */
interface BufferConfig {
  /** 最大缓冲数量 */
  maxBatchSize: number;
  /** 最大等待时间（毫秒） */
  maxWaitMs: number;
}

/** 缓冲条目 */
interface BufferedEntry {
  entry: LogEntry;
  timestamp: number;
}

/** 日志发送函数类型 */
type SendFunction = (entries: LogEntry[]) => Promise<void>;

/**
 * 日志缓冲器
 */
export class LogBuffer {
  private buffer: BufferedEntry[] = [];
  private config: BufferConfig;
  private sendFn: SendFunction;
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private isFlushing: boolean = false;

  constructor(
    sendFn: SendFunction,
    config: Partial<BufferConfig> = {}
  ) {
    this.sendFn = sendFn;
    this.config = {
      maxBatchSize: config.maxBatchSize ?? 10,
      maxWaitMs: config.maxWaitMs ?? 100,
    };
  }

  /**
   * 添加日志到缓冲区
   */
  add(entry: LogEntry): void {
    this.buffer.push({
      entry,
      timestamp: Date.now(),
    });

    // 检查是否需要立即刷新
    if (this.buffer.length >= this.config.maxBatchSize) {
      this.flush();
      return;
    }

    // 设置定时器
    this.scheduleFlush();
  }

  /**
   * 立即刷新缓冲区
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    // 取消定时器
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    this.isFlushing = true;

    // 取出所有缓冲的条目
    const entries = this.buffer.map((b) => b.entry);
    this.buffer = [];

    try {
      await this.sendFn(entries);
    } catch (error) {
      // 发送失败，输出到控制台
      console.error('[LogBuffer] Failed to send batch:', error);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * 调度刷新
   */
  private scheduleFlush(): void {
    if (this.flushTimeout) {
      return;
    }

    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.flush();
    }, this.config.maxWaitMs);
  }

  /**
   * 获取当前缓冲区大小
   */
  get size(): number {
    return this.buffer.length;
  }
}
