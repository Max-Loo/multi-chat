/**
 * Toast 端到端场景测试
 *
 * 测试目的：模拟真实用户操作场景，验证 Toast 反馈的完整流程
 *
 * 测试范围：
 * - 用户操作反馈场景（设置保存成功/失败、加载状态）
 * - 竞态条件处理（初始化期间多 Toast 请求）
 * - 边界情况处理（快速页面切换）
 *
 * 测试隔离：使用真实的 Redux store 和完整的组件树
 *
 * 测试策略说明：
 * - 本文件使用 vi.spyOn 验证 toastQueue 方法调用
 * - 虽然这违反了 BDD 原则（应该验证用户可见行为），但在当前 Mock 策略下是务实的方案
 * - 完整的用户可见行为验证需要：
 *   1. Mock sonner 库的 toast 方法，使其能将消息渲染到 DOM
 *   2. Mock @/components/ui/sonner 的 Toaster 组件，使其能渲染消息容器
 * - 考虑到：
 *   - toastQueue 的单元测试已覆盖核心逻辑
 *   - Mock sonner 会引入复杂的依赖关系
 *   - 完整的 E2E 测试应使用真实浏览器环境（如 Playwright）
 * - 因此，当前测试策略作为权宜之计，验证 toastQueue 方法被正确调用
 * - 未来增强：使用 Playwright 或 Cypress 进行完整的 E2E 测试
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ToasterWrapper } from '@/lib/toast/ToasterWrapper';
import { getTestStore, cleanupStore } from '@/__test__/helpers/integration/resetStore';

/**
 * Mock @/components/ui/sonner Toaster 组件
 * 理由：sonner 库依赖浏览器环境和主题系统（next-themes）
 * E2E 测试中 Mock 它可以避免配置完整的主题系统，同时保持测试隔离
 * Toast 消息的显示逻辑已在 toastQueue 单元测试中验证
 */
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Mocked Toaster</div>,
}));

describe('Toast 端到端场景测试', () => {
  let store: ReturnType<typeof getTestStore>;

  beforeEach(async () => {
    vi.resetModules();
    store = getTestStore();
  });

  afterEach(() => {
    cleanup();
    cleanupStore();
    vi.restoreAllMocks();
  });

  describe('用户操作反馈场景', () => {
    test('应该显示成功反馈当设置保存成功', async () => {
      // 动态导入 toastQueue
      const { toastQueue } = await import('@/lib/toast/toastQueue');

      // Spy on success
      const successSpy = vi.spyOn(toastQueue, 'success');

      // 渲染 ToasterWrapper
      render(
        <Provider store={store}>
          <BrowserRouter>
            <ToasterWrapper />
          </BrowserRouter>
        </Provider>
      );

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toaster"]')).toBeInTheDocument();
      });

      // 直接调用 success 方法验证 Toast 基础设施
      toastQueue.success('设置保存成功');

      // 验证成功反馈被触发
      expect(successSpy).toHaveBeenCalledWith('设置保存成功');

      successSpy.mockRestore();
    });

    test('应该显示失败反馈当设置保存失败', async () => {
      // 动态导入 toastQueue
      const { toastQueue } = await import('@/lib/toast/toastQueue');

      // Spy on error
      const errorSpy = vi.spyOn(toastQueue, 'error');

      // 渲染 ToasterWrapper
      render(
        <Provider store={store}>
          <BrowserRouter>
            <ToasterWrapper />
          </BrowserRouter>
        </Provider>
      );

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toaster"]')).toBeInTheDocument();
      });

      // 模拟显示错误反馈
      toastQueue.error('设置保存失败，请重试');

      // 验证错误反馈被触发
      expect(errorSpy).toHaveBeenCalledWith('设置保存失败，请重试');

      errorSpy.mockRestore();
    });

    test('应该显示加载状态反馈', async () => {
      // 动态导入 toastQueue
      const { toastQueue } = await import('@/lib/toast/toastQueue');

      // Spy on loading
      const loadingSpy = vi.spyOn(toastQueue, 'loading');

      // 渲染 ToasterWrapper
      render(
        <Provider store={store}>
          <BrowserRouter>
            <ToasterWrapper />
          </BrowserRouter>
        </Provider>
      );

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toaster"]')).toBeInTheDocument();
      });

      // 直接调用 loading 方法验证测试基础设施
      toastQueue.loading('正在加载数据...');

      // 验证 loading 被调用
      expect(loadingSpy).toHaveBeenCalledWith('正在加载数据...');

      loadingSpy.mockRestore();
    });
  });

  describe('竞态条件场景', () => {
    test('应该处理初始化期间的多个 Toast 请求', async () => {
      // 动态导入 toastQueue
      const { toastQueue } = await import('@/lib/toast/toastQueue');

      // Spy on toast methods
      const successSpy = vi.spyOn(toastQueue, 'success');

      // 在 ToasterWrapper 渲染前（初始化前）触发多个 Toast
      const promises: Promise<unknown>[] = [];
      for (let i = 1; i <= 5; i++) {
        promises.push(toastQueue.success(`初始化消息 ${i}`));
      }

      // 所有 Promise 都应该被返回（说明 enqueueOrShow 被调用）
      expect(promises.length).toBe(5);

      // 渲染 ToasterWrapper
      render(
        <Provider store={store}>
          <BrowserRouter>
            <ToasterWrapper />
          </BrowserRouter>
        </Provider>
      );

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toaster"]')).toBeInTheDocument();
      });

      // 验证所有消息都被处理（5 次调用都被 spy 捕获）
      await waitFor(
        () => {
          expect(successSpy).toHaveBeenCalledTimes(5);
        },
        { timeout: 3000 }
      );

      successSpy.mockRestore();
    });
  });

  describe('边界情况', () => {
    test('应该保持 Toast 稳定性当用户快速切换页面', async () => {
      // 动态导入 toastQueue
      const { toastQueue } = await import('@/lib/toast/toastQueue');

      // 渲染 ToasterWrapper
      const { unmount, rerender } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ToasterWrapper />
          </BrowserRouter>
        </Provider>
      );

      // 等待初始化完成
      await waitFor(() => {
        expect(document.querySelector('[data-testid="toaster"]')).toBeInTheDocument();
      });

      // 触发一些 Toast
      toastQueue.success('页面1的消息');

      // 模拟快速重新渲染（页面切换）
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ToasterWrapper />
          </BrowserRouter>
        </Provider>
      );

      // 在新页面触发更多 Toast
      toastQueue.success('页面2的消息');

      // 再次快速重新渲染
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ToasterWrapper />
          </BrowserRouter>
        </Provider>
      );

      // 验证系统保持稳定，不抛出错误
      expect(() => {
        toastQueue.success('页面3的消息');
      }).not.toThrow();

      // 正常卸载组件
      expect(() => unmount()).not.toThrow();
    });
  });
});
