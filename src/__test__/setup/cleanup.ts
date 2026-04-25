/**
 * 测试清理层
 *
 * 包含自定义断言、afterEach 清理钩子和 unhandledrejection 抑制逻辑
 */

import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupCustomAssertions } from '../helpers/assertions/setup';

// 扩展自定义断言
setupCustomAssertions();

// ========================================
// 测试环境清理
// ========================================

// 在每个测试后清理所有 Mock 和状态
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ========================================
// 抑制测试中的预期 Unhandled Rejection 警告
// ========================================
// 在测试错误处理场景时，我们会故意创建被拒绝的 Promise
// 这些 Promise 会被测试代码正确处理，但 Vitest 仍会报告为 "unhandled"
// 添加一个全局处理器来抑制这些预期的警告

if (typeof window !== 'undefined' && 'addEventListener' in window) {
  window.addEventListener('unhandledrejection', (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (event.reason as any)?.message || String(event.reason);

    const expectedErrorPatterns = [
      'Network error',
      'Request timeout',
      'API Error',
      'Invalid JSON response',
      'Connection refused',
      'Failed to fetch',
    ];

    const isExpectedError = expectedErrorPatterns.some(pattern =>
      errorMessage.includes(pattern)
    );

    if (isExpectedError) {
      event.preventDefault();
    }
  });
} else if (typeof process !== 'undefined' && 'on' in process) {
  process.on('unhandledRejection', (reason: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (reason as any)?.message || String(reason);

    const expectedErrorPatterns = [
      'Network error',
      'Request timeout',
      'API Error',
      'Invalid JSON response',
      'Connection refused',
      'Failed to fetch',
    ];

    const isExpectedError = expectedErrorPatterns.some(pattern =>
      errorMessage.includes(pattern)
    );

    if (!isExpectedError) {
      console.error('Unhandled Rejection:', reason);
    }
  });
}
