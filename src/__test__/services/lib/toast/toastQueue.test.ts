/**
 * ToastQueue 单元测试
 *
 * 测试策略：使用 vi.resetModules() 和动态导入实现测试隔离
 * - 每个测试前重置模块缓存，获得新的 toastQueue 单例
 * - 使用 vi.doMock('sonner') Mock sonner 库
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ToastQueue', () => {
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
    promise: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();

    mockToast = {
      success: vi.fn(() => 'success-id'),
      error: vi.fn(() => 'error-id'),
      warning: vi.fn(() => 'warning-id'),
      info: vi.fn(() => 'info-id'),
      loading: vi.fn(() => 'loading-id'),
      dismiss: vi.fn(),
      promise: vi.fn(),
    };

    vi.doMock('sonner', () => ({
      toast: mockToast,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('队列机制', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该在初始化前调用 Toast 时入队', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      void toastQueue.success('测试消息');

      expect(mockToast.success).not.toHaveBeenCalled();

      vi.advanceTimersByTime(0);
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('应该在 markReady 后刷新队列', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      void toastQueue.success('消息1');
      void toastQueue.error('消息2');

      expect(mockToast.success).not.toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();

      toastQueue.markReady();

      expect(mockToast.success).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith('消息1', { position: 'bottom-right' });

      await vi.advanceTimersByTimeAsync(500);
      expect(mockToast.error).toHaveBeenCalledTimes(1);
    });

    it('应该在 markReady 后新 Toast 立即显示', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      toastQueue.markReady();

      toastQueue.success('新消息');

      expect(mockToast.success).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith('新消息', { position: 'bottom-right' });
    });

    it('应该在空队列调用 markReady 时不抛出错误', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      expect(() => toastQueue.markReady()).not.toThrow();
    });
  });

  describe('响应式位置', () => {
    it('应该在移动端强制使用 top-center', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      toastQueue.setIsMobile(true);
      toastQueue.markReady();

      toastQueue.success('测试消息', { position: 'bottom-right' });

      expect(mockToast.success).toHaveBeenCalledWith('测试消息', { position: 'top-center' });
    });

    it('应该在桌面端默认使用 bottom-right', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      toastQueue.setIsMobile(false);
      toastQueue.markReady();

      toastQueue.success('测试消息');

      expect(mockToast.success).toHaveBeenCalledWith('测试消息', { position: 'bottom-right' });
    });

    it('应该在桌面端保留用户传入的 position', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      toastQueue.setIsMobile(false);
      toastQueue.markReady();

      toastQueue.success('测试消息', { position: 'top-center' });

      expect(mockToast.success).toHaveBeenCalledWith('测试消息', { position: 'top-center' });
    });

    it('应该在未设置 isMobile 时默认使用桌面端位置', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      toastQueue.markReady();

      toastQueue.success('测试消息');

      expect(mockToast.success).toHaveBeenCalledWith('测试消息', { position: 'bottom-right' });
    });
  });

  describe('异步 Promise', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该返回 Promise', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      const result = toastQueue.success('测试消息');

      expect(result).toBeInstanceOf(Promise);
    });

    it('应该在 Toaster 就绪时 Promise 立即 resolve', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      toastQueue.markReady();

      const toastId = await toastQueue.success('测试消息');

      expect(toastId).toBe('success-id');
    });

    it('应该在 Toaster 未就绪时 Promise 延迟 resolve', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      const promise = toastQueue.success('测试消息');

      let resolved = false;
      promise.then(() => { resolved = true; });

      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);

      toastQueue.markReady();
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该在 action 执行失败时不抛出异常', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockToast.success = vi.fn(() => {
        throw new Error('Toast error');
      });

      const { toastQueue } = await import('@/services/toast/toastQueue');
      toastQueue.markReady();

      let result: string | number | undefined;
      let error: Error | undefined;

      try {
        result = await toastQueue.success('测试消息');
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeUndefined();
      expect(result).toBeUndefined();

      consoleErrorSpy.mockRestore();
    });

    it('应该在 action 执行失败时记录错误日志', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockToast.success = vi.fn(() => {
        throw new Error('Toast error');
      });

      const { toastQueue } = await import('@/services/toast/toastQueue');
      toastQueue.markReady();

      await toastQueue.success('测试消息');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Toast execution error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('所有 Toast 类型', () => {
    it('应该调用 success 类型', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      toastQueue.markReady();

      await toastQueue.success('成功消息');

      expect(mockToast.success).toHaveBeenCalledWith('成功消息', { position: 'bottom-right' });
    });

    it('应该调用 error 类型', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      toastQueue.markReady();

      await toastQueue.error('错误消息');

      expect(mockToast.error).toHaveBeenCalledWith('错误消息', { position: 'bottom-right' });
    });

    it('应该调用 warning 类型', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      toastQueue.markReady();

      await toastQueue.warning('警告消息');

      expect(mockToast.warning).toHaveBeenCalledWith('警告消息', { position: 'bottom-right' });
    });

    it('应该调用 info 类型', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      toastQueue.markReady();

      await toastQueue.info('信息消息');

      expect(mockToast.info).toHaveBeenCalledWith('信息消息', { position: 'bottom-right' });
    });

    it('应该调用 loading 类型', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');
      toastQueue.markReady();

      await toastQueue.loading('加载中');

      expect(mockToast.loading).toHaveBeenCalledWith('加载中', { position: 'bottom-right' });
    });
  });

  describe('dismiss 和 promise 方法', () => {
    it('应该立即执行 dismiss 不经过队列', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      toastQueue.dismiss('toast-id');

      expect(mockToast.dismiss).toHaveBeenCalledWith('toast-id');
    });

    it('应该立即执行 promise 不经过队列', async () => {
      const { toastQueue } = await import('@/services/toast/toastQueue');

      const mockPromise = Promise.resolve('data');
      toastQueue.promise(mockPromise, {
        loading: '加载中',
        success: '成功',
        error: '失败',
      });

      expect(mockToast.promise).toHaveBeenCalledWith(mockPromise, {
        loading: '加载中',
        success: '成功',
        error: '失败',
      });
    });
  });
});
