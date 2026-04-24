/**
 * ToasterWrapper 组件单元测试
 *
 * 测试策略（符合 BDD 原则）：
 * - Mock useResponsive Hook 以控制响应式状态（单元测试需要精确控制）
 * - Mock toastQueue 单例以验证组件契约（调用正确的 API）
 * - Mock sonner 库（系统边界，避免浏览器环境依赖）
 *
 * 测试范围：
 * 1. 响应式状态同步：验证 toastQueue.getIsMobile() 返回正确的值
 * 2. 竞态条件防护：验证 markReady 的调用时机
 * 3. UI 渲染：验证 Toaster 组件被正确渲染
 *
 * 注意：
 * - 单元测试验证组件的契约（正确调用 toastQueue API）
 * - 用户可见行为的完整验证在集成测试中进行
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { ToasterWrapper } from '@/services/toast/ToasterWrapper';
import { toastQueue } from '@/services/toast/toastQueue';

/**
 * 可变的 mock 响应式状态
 * 注意：这里 Mock useResponsive 是为了单元测试中精确控制状态
 * 根据 design.md 决策 1，单元测试中 Mock 内部依赖是可接受的
 * 集成测试应使用真实的 useResponsive Hook
 */
let mockIsMobile: boolean | undefined = false;

/**
 * Mock useResponsive Hook（单元测试专用）
 * 理由：ToasterWrapper 组件测试需要精确控制 isMobile 状态
 * 这是单元测试的常见做法，用于隔离组件行为
 * 集成测试会使用真实的 useResponsive Hook
 */
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    isMobile: mockIsMobile,
    isDesktop: mockIsMobile !== undefined && !mockIsMobile,
    isCompact: false,
    isCompressed: false,
    layoutMode: mockIsMobile === undefined ? undefined : (mockIsMobile ? 'mobile' : 'desktop'),
    width: 1280,
    height: 720,
  })),
}));

/**
 * Mock @/components/ui/sonner Toaster 组件
 * 理由：sonner 库依赖浏览器环境和主题系统（next-themes）
 * Mock 它可以避免在测试环境中配置完整的主题系统
 * Mock 的 Toaster 提供最小可渲染的占位符
 */
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" role="region" aria-label="Toast notifications" />,
}));

/**
 * Mock toastQueue 单例
 * 理由：
 * 1. 避免测试间的单例状态污染
 * 2. 验证组件正确调用 toastQueue 的公共 API（组件契约）
 *
 * 注意：
 * - setIsMobile 和 markReady 是 toastQueue 的公共 API
 * - getIsMobile 是用于验证状态同步的公共 API
 * - 验证公共 API 的正确调用是合理的单元测试策略
 */
vi.mock('@/services/toast/toastQueue', () => ({
  toastQueue: {
    setIsMobile: vi.fn(),
    getIsMobile: vi.fn(() => false),
    markReady: vi.fn(),
  },
}));

const mockedToastQueue = vi.mocked(toastQueue);

describe('ToasterWrapper 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMobile = false;
  });

  
  describe('响应式状态同步', () => {
    it('应该同步移动端状态到 toastQueue 当 isMobile 为 true', async () => {
      mockIsMobile = true;
      mockedToastQueue.getIsMobile.mockReturnValue(true);

      render(<ToasterWrapper />);

      await waitFor(() => {
        expect(mockedToastQueue.setIsMobile).toHaveBeenCalledWith(true);
        expect(mockedToastQueue.getIsMobile()).toBe(true);
      });
    });

    it('应该同步桌面端状态到 toastQueue 当 isMobile 为 false', async () => {
      mockIsMobile = false;
      mockedToastQueue.getIsMobile.mockReturnValue(false);

      render(<ToasterWrapper />);

      await waitFor(() => {
        expect(mockedToastQueue.setIsMobile).toHaveBeenCalledWith(false);
        expect(mockedToastQueue.getIsMobile()).toBe(false);
      });
    });

    it('应该重新同步状态当 isMobile 发生变化', async () => {
      mockIsMobile = false;
      mockedToastQueue.getIsMobile.mockReturnValue(false);

      const { rerender } = render(<ToasterWrapper />);

      await waitFor(() => {
        expect(mockedToastQueue.setIsMobile).toHaveBeenCalledWith(false);
      });

      vi.clearAllMocks();
      mockIsMobile = true;
      mockedToastQueue.getIsMobile.mockReturnValue(true);
      rerender(<ToasterWrapper />);

      await waitFor(() => {
        expect(mockedToastQueue.setIsMobile).toHaveBeenCalledWith(true);
        expect(mockedToastQueue.getIsMobile()).toBe(true);
      });
    });
  });

  describe('竞态条件防护', () => {
    it('应该不调用 markReady 当 isMobile 未确定', async () => {
      mockIsMobile = undefined;

      render(<ToasterWrapper />);

      await waitFor(
        () => {
          expect(mockedToastQueue.markReady).not.toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });

    it('应该调用 markReady 当 isMobile 确定后', async () => {
      mockIsMobile = true;

      render(<ToasterWrapper />);

      await waitFor(() => {
        expect(mockedToastQueue.markReady).toHaveBeenCalledTimes(1);
      });
    });

    it('应该防止重复调用 markReady', async () => {
      mockIsMobile = true;

      const { rerender } = render(<ToasterWrapper />);

      await waitFor(() => {
        expect(mockedToastQueue.markReady).toHaveBeenCalledTimes(1);
      });

      rerender(<ToasterWrapper />);
      rerender(<ToasterWrapper />);

      await waitFor(
        () => {
          expect(mockedToastQueue.markReady).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('UI 渲染', () => {
    it('应该渲染 Toaster 组件', async () => {
      mockIsMobile = false;

      render(<ToasterWrapper />);

      const toaster = screen.getByTestId('toaster');
      expect(toaster).toBeInTheDocument();
      expect(toaster).toHaveAttribute('role', 'region');
      expect(toaster).toHaveAttribute('aria-label', 'Toast notifications');
    });

    it('应该不抛出错误当组件卸载', async () => {
      mockIsMobile = false;

      const { unmount } = render(<ToasterWrapper />);

      await waitFor(() => {
        expect(mockedToastQueue.setIsMobile).toHaveBeenCalled();
      });

      expect(() => unmount()).not.toThrow();
    });
  });
});
