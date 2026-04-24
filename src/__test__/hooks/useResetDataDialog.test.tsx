import { render, renderHook, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useResetDataDialog } from '@/hooks/useResetDataDialog';

// Mock react-i18next 提供对话框文本
vi.mock('react-i18next', () => globalThis.__mockI18n());

// Mock resetAllData 避免真实重置操作
const mockResetAllData = vi.fn();
vi.mock('@/utils/resetAllData', () => ({
  resetAllData: (...args: unknown[]) => mockResetAllData(...args),
}));

describe('useResetDataDialog', () => {
  beforeEach(() => {
    // 阻止 window.location.reload 在测试中刷新页面
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  describe('初始状态', () => {
    it('应该返回初始关闭状态 当 hook 初始化时', () => {
      const { result } = renderHook(() => useResetDataDialog());

      expect(result.current.isDialogOpen).toBe(false);
      expect(result.current.isResetting).toBe(false);
    });
  });

  describe('对话框开关', () => {
    it('应该打开对话框 当调用 setIsDialogOpen(true)', () => {
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      expect(result.current.isDialogOpen).toBe(true);
    });

    it('应该关闭对话框 当调用 setIsDialogOpen(false)', () => {
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });
      expect(result.current.isDialogOpen).toBe(true);

      act(() => {
        result.current.setIsDialogOpen(false);
      });
      expect(result.current.isDialogOpen).toBe(false);
    });

    it('应该渲染确认和取消按钮 当对话框打开时', () => {
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      // renderResetDialog 返回 AlertDialog 组件，挂载到 DOM
      const dialog = result.current.renderResetDialog();
      render(<>{dialog}</>);

      expect(screen.getByRole('heading', { name: '确认重置' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    });
  });

  describe('确认重置成功流程', () => {
    it('应该调用 resetAllData 并设置 isResetting 当确认重置成功', async () => {
      mockResetAllData.mockResolvedValue(undefined);
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      await act(async () => {
        await result.current.handleConfirmReset();
      });

      expect(mockResetAllData).toHaveBeenCalledTimes(1);
    });

    it('应该调用 window.location.reload 当重置成功时', async () => {
      mockResetAllData.mockResolvedValue(undefined);
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      await act(async () => {
        await result.current.handleConfirmReset();
      });

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it('应该设置 isResetting 为 true 当重置进行中', async () => {
      let resolveReset: () => void;
      mockResetAllData.mockReturnValue(new Promise<void>((resolve) => {
        resolveReset = resolve;
      }));

      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      // 启动重置（不等待完成）
      let resetPromise: Promise<void>;
      await act(async () => {
        resetPromise = result.current.handleConfirmReset();
      });

      // 在 resetAllData resolve 之前，isResetting 应为 true
      expect(result.current.isResetting).toBe(true);

      // 完成 resetAllData
      await act(async () => {
        resolveReset!();
        await resetPromise;
      });
    });
  });

  describe('确认重置失败流程', () => {
    it('应该不调用 window.location.reload 当 resetAllData 失败', async () => {
      mockResetAllData.mockRejectedValue(new Error('重置失败'));
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      await act(async () => {
        await result.current.handleConfirmReset();
      });

      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('应该恢复 isResetting 和 isDialogOpen 当 resetAllData 失败', async () => {
      mockResetAllData.mockRejectedValue(new Error('重置失败'));
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      await act(async () => {
        await result.current.handleConfirmReset();
      });

      expect(result.current.isResetting).toBe(false);
      expect(result.current.isDialogOpen).toBe(false);
    });

    it('应该记录错误到控制台 当 resetAllData 失败', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockResetAllData.mockRejectedValue(new Error('重置失败'));

      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      await act(async () => {
        await result.current.handleConfirmReset();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('确认按钮样式', () => {
    it('应该使用 destructive 样式 当确认按钮渲染时', () => {
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      const dialog = result.current.renderResetDialog();
      render(<>{dialog}</>);

      const confirmButton = screen.getByRole('button', { name: '确认重置' });
      expect(confirmButton.className).toContain('destructive');
    });
  });

  describe('并发双击防护', () => {
    it('应该在第一次确认后锁定 isResetting 防止重复调用', async () => {
      mockResetAllData.mockReturnValue(new Promise<void>(() => {}));
      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      act(() => {
        result.current.handleConfirmReset();
      });

      // isResetting 为 true → UI 层按钮 disabled → 阻止用户重复点击
      expect(result.current.isResetting).toBe(true);
      expect(mockResetAllData).toHaveBeenCalledTimes(1);
    });
  });

  describe('重置中按钮禁用状态', () => {
    it('应该禁用确认和取消按钮 当 isResetting 为 true', async () => {
      // 让 resetAllData 保持在 pending 状态
      mockResetAllData.mockReturnValue(new Promise<void>(() => {}));

      const { result } = renderHook(() => useResetDataDialog());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      // 启动重置
      act(() => {
        result.current.handleConfirmReset();
      });

      // 渲染对话框检查按钮状态
      const dialog = result.current.renderResetDialog();
      render(<>{dialog}</>);

      const confirmButton = screen.getByRole('button', { name: '确认重置' });
      const cancelButton = screen.getByRole('button', { name: '取消' });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });
});
