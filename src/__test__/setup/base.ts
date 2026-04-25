/**
 * 测试环境基础设施层
 *
 * 包含 Polyfill、jest-dom 扩展、环境标识和 globalThis mock 工厂注册
 */

import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import 'fake-indexeddb/auto';
import { createI18nMockReturn, mockI18n } from '@/__test__/helpers/mocks/i18n';
import { createMemoryStorageMock } from '@/__test__/helpers/mocks/storage';
import { createResponsiveMock } from '@/__test__/helpers/mocks/responsive';
import { createTauriCompatModuleMock } from '@/__test__/helpers/mocks/tauriCompat';
import { createToastQueueModuleMock } from '@/__test__/helpers/mocks/toast';
import { createScrollbarMock } from '@/__test__/helpers/mocks/scrollbar';
import { createMarkdownItMock } from '@/__test__/helpers/mocks/markdown';
import { createDompurifyMock } from '@/__test__/helpers/mocks/dompurify';

// 扩展 Vitest 的 expect 断言（@testing-library/jest-dom）
expect.extend(matchers);

// ========================================
// 全局 Polyfill
// ========================================
// happy-dom 不提供 ResizeObserver，为所有测试统一注册空 polyfill
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 设置全局测试环境标识，用于优化加密性能
(globalThis as Record<string, unknown>).__VITEST__ = true;

// ========================================
// globalThis Mock 工厂注册
// ========================================
// 将 mock 工厂函数注册到 globalThis，供测试文件中的 vi.mock 工厂使用
// vi.mock 的工厂函数存在 hoisting 限制，无法使用常规 import

// eslint-disable-next-line no-var
var __i18nMock: typeof createI18nMockReturn = createI18nMockReturn;
globalThis.__createI18nMockReturn = __i18nMock;

// eslint-disable-next-line no-var
var __mockI18nFn: typeof mockI18n = mockI18n;
globalThis.__mockI18n = __mockI18nFn;

// eslint-disable-next-line no-var
var __storageMock: typeof createMemoryStorageMock = createMemoryStorageMock;
globalThis.__createMemoryStorageMock = __storageMock;

// eslint-disable-next-line no-var
var __responsiveMock = createResponsiveMock;
globalThis.__createResponsiveMock = __responsiveMock;

// eslint-disable-next-line no-var
var __tauriCompatModuleMock = createTauriCompatModuleMock;
globalThis.__createTauriCompatModuleMock = __tauriCompatModuleMock;

// eslint-disable-next-line no-var
var __toastModuleMock = createToastQueueModuleMock;
globalThis.__createToastQueueModuleMock = __toastModuleMock;

// eslint-disable-next-line no-var
var __scrollbarMock = createScrollbarMock;
globalThis.__createScrollbarMock = __scrollbarMock;

// eslint-disable-next-line no-var
var __markdownItMock = createMarkdownItMock;
globalThis.__createMarkdownItMock = __markdownItMock;

// eslint-disable-next-line no-var
var __dompurifyMock = createDompurifyMock;
globalThis.__createDompurifyMock = __dompurifyMock;
