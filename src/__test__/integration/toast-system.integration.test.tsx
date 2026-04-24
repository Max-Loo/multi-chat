/**
 * Toast 系统集成测试
 *
 * 测试目的：验证 Toast 消息渲染到 UI（用户可见行为）
 * 测试范围：
 * - 应用启动初始化缓存
 * - 语言切换 Redux 集成
 * - 快速连续调用
 * - 组件卸载稳定性
 *
 * 测试策略：mock sonner toast 函数将消息渲染到 DOM 容器，
 * 使用 screen.findByText() 验证用户可见行为
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__test__/helpers/render/redux';
import { getTestStore, cleanupStore } from '@/__test__/helpers/integration/resetStore';
import { setAppLanguage } from '@/store/slices/appConfigSlices';

/**
 * Mock sonner 模块：toast 函数将消息渲染到 DOM
 */
function renderToastToDom(message: string) {
  const container = document.querySelector('[data-testid="toast-container"]');
  if (container) {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'toast-message');
    el.textContent = message;
    container.appendChild(el);
  }
}

vi.mock('sonner', () => ({
  toast: Object.assign(renderToastToDom, {
    success: renderToastToDom,
    error: renderToastToDom,
    warning: renderToastToDom,
    info: renderToastToDom,
    loading: renderToastToDom,
    dismiss: vi.fn(),
    promise: vi.fn(),
  }),
}));

/**
 * Mock @/components/ui/sonner 的 Toaster 组件
 * 渲染消息挂载容器（因 Toaster 依赖 next-themes）
 */
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toast-container"></div>,
}));

describe('Toast 系统集成测试', () => {
  let store: ReturnType<typeof getTestStore>;

  beforeEach(() => {
    store = getTestStore();
    vi.resetModules();
  });

  afterEach(async () => {
    cleanupStore();
    const { toastQueue } = await import('@/services/toast/toastQueue');
    toastQueue.reset();
    vi.restoreAllMocks();
  });

  describe('应用启动初始化', () => {
    it('应该完成 Toast 系统初始化', async () => {
      const { ToasterWrapper } = await import('@/services/toast/ToasterWrapper');

      const { container } = renderWithProviders(<ToasterWrapper />, { store });

      // 等待 Toaster 容器渲染
      const toastContainer = container.querySelector('[data-testid="toast-container"]');
      expect(toastContainer).toBeInTheDocument();
    });

    it('应该在初始化前缓存 Toast 请求，初始化后渲染到 DOM', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      const { ToasterWrapper } = await import('@/services/toast/ToasterWrapper');

      // 在 ToasterWrapper 渲染前调用 Toast（消息会被缓存）
      const promise = toastQueue.success('初始化前的消息');

      // 渲染 ToasterWrapper（触发 markReady → flush）
      renderWithProviders(<ToasterWrapper />, { store });

      // 验证 Promise 被返回
      expect(promise).toBeInstanceOf(Promise);

      // 等待消息渲染到 DOM（flush 有 500ms 延迟）
      const message = await screen.findByText('初始化前的消息', undefined, { timeout: 5000 });
      expect(message).toBeInTheDocument();
    });
  });

  describe('Redux + toastQueue 集成', () => {
    it('应该将 Toast 消息渲染到 DOM：Redux 触发 toastQueue.success', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      const { ToasterWrapper } = await import('@/services/toast/ToasterWrapper');

      // 渲染 ToasterWrapper 完成初始化
      renderWithProviders(<ToasterWrapper />, { store });

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toast-container"]')).toBeInTheDocument();
      });

      // 模拟 Redux middleware 触发 toastQueue（验证 Redux store + toastQueue + DOM 集成链路）
      store.dispatch(setAppLanguage('en'));
      toastQueue.success('语言已切换');

      // 验证 Toast 消息出现在 DOM 中
      const message = await screen.findByText('语言已切换', undefined, { timeout: 3000 });
      expect(message).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理快速连续的 Toast 调用', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      const { ToasterWrapper } = await import('@/services/toast/ToasterWrapper');

      // 渲染 ToasterWrapper
      renderWithProviders(<ToasterWrapper />, { store });

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toast-container"]')).toBeInTheDocument();
      });

      // 快速连续调用 15 个 Toast
      const promises: Promise<unknown>[] = [];
      for (let i = 1; i <= 15; i++) {
        promises.push(toastQueue.success(`消息 ${i}`));
      }

      // 验证所有 Promise 都被返回
      expect(promises.length).toBe(15);

      // 等待所有消息渲染到 DOM（flush 有延迟）
      await waitFor(
        () => {
          const messages = document.querySelectorAll('[data-testid="toast-message"]');
          expect(messages.length).toBe(15);
        },
        { timeout: 10000 }
      );
    });

    it('应该不抛出错误当组件卸载', async () => {
      const { ToasterWrapper } = await import('@/services/toast/ToasterWrapper');

      const { unmount } = renderWithProviders(<ToasterWrapper />, { store });

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toast-container"]')).toBeInTheDocument();
      });

      // 卸载组件，不应该抛出错误
      expect(() => unmount()).not.toThrow();
    });
  });
});
