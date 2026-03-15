/**
 * Console Transport
 *
 * 将日志输出到浏览器控制台（仅开发模式）
 */

import type { Transport, LogEntry } from '../types';

/**
 * Console Transport 实现
 * 仅在开发模式下启用
 */
export class ConsoleTransport implements Transport {
  private enabled: boolean;

  constructor(enabled: boolean = import.meta.env.DEV) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const timestamp = entry.timestamp;
    const prefix = `[${timestamp}] [${entry.level}] [${entry.source}]`;

    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    const fullMessage = `${prefix} ${entry.message}${contextStr}`;

    switch (entry.level) {
      case 'DEBUG':
        console.debug(fullMessage);
        break;
      case 'INFO':
        console.info(fullMessage);
        break;
      case 'WARN':
        console.warn(fullMessage);
        break;
      case 'ERROR':
        console.error(fullMessage);
        break;
    }
  }
}
