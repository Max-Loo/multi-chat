/**
 * Logger 类
 *
 * 统一的日志接口
 */

import type { LogLevel, LogEntry, LoggerConfig, Transport } from './types';
import { sanitizeContext } from './sanitizers';
import { TauriTransport, ConsoleTransport } from './transports';
import { LogBuffer } from './LogBuffer';

/**
 * Logger 实现类
 */
export class Logger {
  private config: LoggerConfig;
  private transports: Transport[];
  private buffer: LogBuffer;
  private minLevel: LogLevel;

  constructor(config: LoggerConfig = {}) {
    this.config = config;
    this.minLevel = this.getMinLevel();

    // 初始化 transports
    this.transports = [
      new TauriTransport(),
      new ConsoleTransport(),
    ];

    // 初始化缓冲器
    this.buffer = new LogBuffer(async (entries) => {
      // 批量发送到所有 transport
      for (const transport of this.transports) {
        if (transport.isEnabled()) {
          // 优先使用批量写入方法
          if (transport.writeBatch) {
            await transport.writeBatch(entries);
          } else {
            // 降级为逐条写入
            for (const entry of entries) {
              await transport.write(entry);
            }
          }
        }
      }
    });
  }

  /**
   * 获取最小日志级别
   */
  private getMinLevel(): LogLevel {
    // 开发模式允许 DEBUG，生产模式只允许 INFO 及以上
    return import.meta.env.DEV ? 'DEBUG' : 'INFO';
  }

  /**
   * 检查日志级别是否应该记录
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * 创建日志条目
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    // 合并默认上下文和传入的上下文
    const mergedContext = {
      ...this.config.context,
      ...(this.config.module && { module: this.config.module }),
      ...context,
    };

    // 脱敏上下文
    const sanitizedContext = sanitizeContext(mergedContext);

    return {
      timestamp: new Date().toISOString(),
      level,
      source: 'frontend',
      message,
      context: Object.keys(sanitizedContext).length > 0 ? sanitizedContext : undefined,
    };
  }

  /**
   * 记录日志
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createEntry(level, message, context);
    this.buffer.add(entry);
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('DEBUG', message, context);
  }

  /**
   * INFO 级别日志
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('INFO', message, context);
  }

  /**
   * WARN 级别日志（仅消息和上下文）
   * @param message 日志消息
   * @param context 可选的上下文对象
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * WARN 级别日志（带错误对象）
   * @param message 日志消息
   * @param error 错误对象
   * @param context 可选的上下文对象
   */
  warn(message: string, error: Error | unknown, context?: Record<string, unknown>): void;

  /**
   * WARN 级别日志实现
   */
  warn(message: string, errorOrContext?: Error | unknown | Record<string, unknown>, context?: Record<string, unknown>): void {
    let actualContext: Record<string, unknown> = {};

    // 判断第二个参数的类型
    if (errorOrContext instanceof Error) {
      actualContext = {
        ...context,
        error: {
          name: errorOrContext.name,
          message: errorOrContext.message,
          stack: import.meta.env.DEV ? errorOrContext.stack : undefined,
        },
      };
    } else if (errorOrContext && typeof errorOrContext === 'object' && !context) {
      // 第二个参数是上下文对象（普通对象，不是 Error）
      actualContext = errorOrContext as Record<string, unknown>;
    } else if (errorOrContext !== undefined) {
      // 第二个参数是其他类型的错误（非 Error 对象）
      actualContext = {
        ...context,
        error: errorOrContext,
      };
    }

    this.log('WARN', message, actualContext);
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext: Record<string, unknown> = {
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : undefined,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.log('ERROR', message, errorContext);
  }

  /**
   * 创建子 Logger
   */
  child(config: LoggerConfig = {}): Logger {
    return new Logger({
      ...this.config,
      ...config,
      context: {
        ...this.config.context,
        ...config.context,
      },
    });
  }

  /**
   * 立即刷新缓冲区
   */
  async flush(): Promise<void> {
    await this.buffer.flush();
  }
}

/**
 * 创建 Logger 实例
 */
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}
