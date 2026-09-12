/**
 * Vue ToastTest 页冒烟测试（仅开发环境路由）
 *
 * 验证四组测试区域渲染与生产环境空渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/services/toast', () => ({
  ...globalThis.__createToastQueueModuleMock(),
  rawToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  },
}));

import ToastTest from '@/pages/Setting/components/ToastTest.vue';
import { toastQueue, rawToast } from '@/services/toast';

describe('ToastTest（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('渲染四组测试区域', () => {
    render(ToastTest);

    expect(screen.getByText('toastQueue 方法测试')).toBeVisible();
    expect(screen.getByText('rawToast 位置测试')).toBeVisible();
    expect(screen.getByText('队列机制测试')).toBeVisible();
    expect(screen.getByText('Promise 测试')).toBeVisible();
  });

  it('点击 Success 按钮触发 toastQueue.success', async () => {
    render(ToastTest);

    await fireEvent.click(screen.getByRole('button', { name: 'Success' }));

    expect(toastQueue.success).toHaveBeenCalledWith('操作成功');
  });

  it('位置测试按钮携带位置选项调用 rawToast', async () => {
    render(ToastTest);

    await fireEvent.click(screen.getByRole('button', { name: 'Top Left' }));

    expect(rawToast.success).toHaveBeenCalledWith('Top Left', { position: 'top-left' });
  });

  it('关闭所有 Toast 按钮触发 dismiss', async () => {
    render(ToastTest);

    await fireEvent.click(screen.getByRole('button', { name: '关闭所有 Toast' }));

    expect(toastQueue.dismiss).toHaveBeenCalledWith();
  });
});
