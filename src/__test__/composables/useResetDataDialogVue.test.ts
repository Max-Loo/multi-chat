/**
 * useResetDataDialog 组合式函数测试（Vue 版）
 *
 * 验证重置数据对话框的状态管理与确认流程：
 * - 对话框开关
 * - 确认重置成功后刷新页面
 * - 重置失败时关闭对话框并恢复交互
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockResetAllData = vi.fn();
const mockReload = vi.fn();

vi.mock('@/utils/resetAllData', () => ({
  resetAllData: (...args: unknown[]) => mockResetAllData(...args),
}));

vi.stubGlobal('location', { ...window.location, reload: mockReload });

import { useResetDataDialog } from '@/composables/useResetDataDialog';

describe('useResetDataDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('setIsDialogOpen 应控制对话框开关', () => {
    const { isDialogOpen, setIsDialogOpen } = useResetDataDialog();

    expect(isDialogOpen.value).toBe(false);
    setIsDialogOpen(true);
    expect(isDialogOpen.value).toBe(true);
    setIsDialogOpen(false);
    expect(isDialogOpen.value).toBe(false);
  });

  it('确认重置成功后应刷新页面', async () => {
    mockResetAllData.mockResolvedValueOnce(undefined);
    const { handleConfirmReset, isResetting } = useResetDataDialog();

    const promise = handleConfirmReset();

    expect(isResetting.value).toBe(true);
    await promise;

    expect(mockResetAllData).toHaveBeenCalledOnce();
    expect(mockReload).toHaveBeenCalledOnce();
  });

  it('重置失败时应关闭对话框并恢复交互能力', async () => {
    mockResetAllData.mockRejectedValueOnce(new Error('重置失败'));
    const { handleConfirmReset, isResetting, isDialogOpen, setIsDialogOpen } = useResetDataDialog();

    setIsDialogOpen(true);
    await handleConfirmReset();

    expect(isResetting.value).toBe(false);
    expect(isDialogOpen.value).toBe(false);
    expect(mockReload).not.toHaveBeenCalled();
  });
});
