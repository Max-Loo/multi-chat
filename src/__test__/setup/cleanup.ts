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
// 模块状态重置函数（首次调用时延迟加载）
// ========================================

let _resetChatMiddleware: (() => void) | null = null;
let _resetChatsStore: (() => void) | null = null;
let _resetModelsStore: (() => void) | null = null;
let _resetI18nForTest: (() => void) | null = null;
let _providerLoaderReset: (() => void) | null = null;
let _keyringResetState: (() => void) | null = null;
let _toastQueueReset: (() => void) | null = null;
let _loaded = false;

function ensureResetFnsLoaded() {
  if (_loaded) return;
  // 使用 require 同步加载，避免与 vitest mock 系统冲突
  // 这些 import 在 afterEach 中首次触发，此时所有 vi.mock 已生效
  try { _resetChatMiddleware = require('@/store/middleware/chatMiddleware').resetChatMiddleware; } catch { /* 模块不可用 */ }
  try { _resetChatsStore = require('@/store/storage/chatStorage').resetChatsStore; } catch { /* 模块不可用 */ }
  try { _resetModelsStore = require('@/store/storage/modelStorage').resetModelsStore; } catch { /* 模块不可用 */ }
  try { _resetI18nForTest = require('@/services/i18n').resetI18nForTest; } catch { /* 模块不可用 */ }
  try {
    const { getProviderSDKLoader } = require('@/services/chat/providerLoader');
    const loader = getProviderSDKLoader();
    _providerLoaderReset = loader.resetForTest.bind(loader);
  } catch { /* 模块不可用 */ }
  try {
    const { keyring } = require('@/utils/tauriCompat/keyring');
    _keyringResetState = keyring.resetState.bind(keyring);
  } catch { /* 模块不可用 */ }
  try {
    const { toastQueue } = require('@/services/toast/toastQueue');
    _toastQueueReset = toastQueue.reset.bind(toastQueue);
  } catch { /* 模块不可用 */ }
  _loaded = true;
}

// ========================================
// 排除的 reset 函数说明
// ========================================
// highlightLanguageManager._resetInstance()：仅在 highlight 相关的少数测试中影响状态，
// 且这些测试已通过 vi.mock 全局 mock 了 highlight.js，无跨测试泄漏风险
// codeBlockUpdater.cleanupPendingUpdates()：仅在代码块渲染的集成测试中使用，
// Map 中的 pending updates 在测试结束时自然失效（组件卸载后回调不再触发）

// ========================================
// 测试环境清理
// ========================================

// 在每个测试后清理所有 Mock 和状态
afterEach(() => {
  cleanup();

  // 首次调用时加载 reset 函数
  ensureResetFnsLoaded();

  // 消费者层 reset
  _resetChatMiddleware?.();
  _resetChatsStore?.();
  _resetModelsStore?.();
  // 服务层 reset
  _resetI18nForTest?.();
  _providerLoaderReset?.();
  // 基础设施层 reset
  _keyringResetState?.();
  _toastQueueReset?.();

  // mock 清理（最后执行）
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// ========================================
// 抑制测试中的预期 Unhandled Rejection 警告
// ========================================
// 在测试错误处理场景时，我们会故意创建被拒绝的 Promise
// 这些 Promise 会被测试代码正确处理，但 Vitest 仍会报告为 "unhandled"
// 添加一个全局处理器来抑制这些预期的警告

/** 预期的错误模式，用于抑制测试中已知的 unhandled rejection */
const EXPECTED_ERROR_PATTERNS = [
  'Network error',
  'Request timeout',
  'API Error',
  'Invalid JSON response',
  'Connection refused',
  'Failed to fetch',
];

if (typeof window !== 'undefined' && 'addEventListener' in window) {
  window.addEventListener('unhandledrejection', (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (event.reason as any)?.message || String(event.reason);

    const isExpectedError = EXPECTED_ERROR_PATTERNS.some(pattern =>
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

    const isExpectedError = EXPECTED_ERROR_PATTERNS.some(pattern =>
      errorMessage.includes(pattern)
    );

    if (!isExpectedError) {
      console.error('Unhandled Rejection:', reason);
    }
  });
}
