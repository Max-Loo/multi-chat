/**
 * Toast 系统集成测试（Vue 版）
 *
 * 测试目的：验证 Toast 消息渲染到 UI（用户可见行为）
 * - ToasterWrapper 挂载
 * - 初始化前缓存、初始化后渲染
 * - 快速连续调用
 * - 组件卸载稳定性
 *
 * 注意：toastQueue 是模块级单例，每个用例通过 vi.resetModules() 重置状态
 * 并动态导入，保证用例间的队列与就绪标记互相隔离
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';

/**
 * Mock vue-sonner：toast 函数将消息渲染到 DOM 容器
 * 真实 vue-sonner 将消息存入内部状态、随 Toaster 挂载渲染；
 * mock 在容器尚未挂载时短暂重试以模拟这一可见性语义
 */
function renderToastToDom(message: string) {
  let retries = 0;
  const append = () => {
    const container = document.querySelector('[data-testid="toast-container"]');
    if (container) {
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'toast-message');
      el.textContent = message;
      container.appendChild(el);
      return;
    }
    if (retries < 10) {
      retries += 1;
      setTimeout(append, 50);
    }
  };
  append();
}

vi.mock('vue-sonner', () => ({
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
 * Mock Toaster 组件（渲染消息挂载容器）
 */
vi.mock('@/components/ui/sonner', () => ({
  Toaster: { template: '<div data-testid="toast-container"></div>' },
}));

describe('Toast 系统集成测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetModules();
  });

  afterEach(async () => {
    const { toastQueue } = await import('@/services/toast/toastQueue');
    toastQueue.reset();
    vi.restoreAllMocks();
  });

  it('应该完成 Toast 系统初始化（Toaster 容器渲染）', async () => {
    const { default: ToasterWrapper } = await import(
      '@/services/toast/ToasterWrapper.vue'
    );

    render(ToasterWrapper);

    expect(await screen.findByTestId('toast-container')).toBeInTheDocument();
  });

  it('应该在初始化前缓存 Toast 请求，初始化后渲染到 DOM', async () => {
    const { toastQueue } = await import('@/services/toast/toastQueue');
    const { default: ToasterWrapper } = await import(
      '@/services/toast/ToasterWrapper.vue'
    );

    // 在 ToasterWrapper 渲染前调用 Toast（消息会被缓存）
    const promise = toastQueue.success('初始化前的消息');

    render(ToasterWrapper);

    expect(promise).toBeInstanceOf(Promise);

    // 等待消息渲染到 DOM（flush 有 500ms 延迟）
    const message = await screen.findByText('初始化前的消息', undefined, {
      timeout: 5000,
    });
    expect(message).toBeInTheDocument();
  });

  it('初始化后触发的 Toast 应该立即渲染到 DOM', async () => {
    const { toastQueue } = await import('@/services/toast/toastQueue');
    const { default: ToasterWrapper } = await import(
      '@/services/toast/ToasterWrapper.vue'
    );

    render(ToasterWrapper);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toast-container"]')).toBeInTheDocument();
    });

    toastQueue.success('语言已切换');

    const message = await screen.findByText('语言已切换', undefined, {
      timeout: 3000,
    });
    expect(message).toBeInTheDocument();
  });

  it('应该处理快速连续的 Toast 调用', async () => {
    const { toastQueue } = await import('@/services/toast/toastQueue');
    const { default: ToasterWrapper } = await import(
      '@/services/toast/ToasterWrapper.vue'
    );

    render(ToasterWrapper);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toast-container"]')).toBeInTheDocument();
    });

    const promises: Promise<unknown>[] = [];
    for (let i = 1; i <= 15; i++) {
      promises.push(toastQueue.success(`消息 ${i}`));
    }
    expect(promises.length).toBe(15);

    await waitFor(
      () => {
        const messages = document.querySelectorAll('[data-testid="toast-message"]');
        expect(messages.length).toBe(15);
      },
      { timeout: 15000 },
    );
  });

  it('卸载组件时应该不抛出错误', async () => {
    const { default: ToasterWrapper } = await import(
      '@/services/toast/ToasterWrapper.vue'
    );

    const { unmount } = render(ToasterWrapper);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toast-container"]')).toBeInTheDocument();
    });

    expect(() => unmount()).not.toThrow();
  });
});
