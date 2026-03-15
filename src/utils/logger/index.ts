/**
 * 日志模块入口
 *
 * 导出默认 logger 实例和相关类型
 */

export { Logger, createLogger } from './Logger';
export { LogBuffer } from './LogBuffer';
export * from './types';
export * from './sanitizers';
export * from './transports';

// 默认 logger 实例
import { Logger } from './Logger';

export const logger = new Logger();

// 全局错误捕获设置函数
export function setupGlobalErrorCapture(loggerInstance: Logger = logger): void {
  // 捕获未处理的异常
  window.addEventListener('error', (event) => {
    loggerInstance.error('Uncaught error', event.error, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      message: event.message,
    });
  });

  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    loggerInstance.error('Unhandled promise rejection', reason instanceof Error ? reason : undefined, {
      reason: reason instanceof Error ? undefined : reason,
    });
  });
}
