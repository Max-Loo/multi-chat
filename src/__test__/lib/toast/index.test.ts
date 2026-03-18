/**
 * Toast API 单元测试
 *
 * 测试 @/lib/toast 模块的导出是否正确
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Toast API 导出', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('sonner', () => ({
      toast: {
        success: vi.fn(() => 'success-id'),
        error: vi.fn(() => 'error-id'),
        warning: vi.fn(() => 'warning-id'),
        info: vi.fn(() => 'info-id'),
        loading: vi.fn(() => 'loading-id'),
        dismiss: vi.fn(),
        promise: vi.fn(),
      },
    }));
  });

  describe('toastQueue 导出', () => {
    it('应该正确导出 toastQueue 单例', async () => {
      const { toastQueue } = await import('@/lib/toast');

      expect(toastQueue).toBeDefined();
      expect(typeof toastQueue.success).toBe('function');
      expect(typeof toastQueue.error).toBe('function');
      expect(typeof toastQueue.warning).toBe('function');
      expect(typeof toastQueue.info).toBe('function');
      expect(typeof toastQueue.loading).toBe('function');
      expect(typeof toastQueue.dismiss).toBe('function');
      expect(typeof toastQueue.promise).toBe('function');
    });
  });

  describe('rawToast 导出', () => {
    it('应该正确导出 rawToast 对象', async () => {
      const { rawToast } = await import('@/lib/toast');

      expect(rawToast).toBeDefined();
      expect(typeof rawToast.success).toBe('function');
    });
  });

  describe('方法返回值', () => {
    it('toastQueue 方法返回 Promise', async () => {
      const { toastQueue } = await import('@/lib/toast');
      toastQueue.markReady();

      const result = toastQueue.success('测试消息');

      expect(result).toBeInstanceOf(Promise);
    });

    it('dismiss 不返回 Promise', async () => {
      const { toastQueue } = await import('@/lib/toast');

      const result = toastQueue.dismiss('toast-id');

      expect(result).toBeUndefined();
    });

    it('promise 不返回 Promise', async () => {
      const { toastQueue } = await import('@/lib/toast');

      const result = toastQueue.promise(Promise.resolve('data'), {
        loading: '加载中',
        success: '成功',
        error: '失败',
      });

      expect(result).toBeUndefined();
    });
  });
});
