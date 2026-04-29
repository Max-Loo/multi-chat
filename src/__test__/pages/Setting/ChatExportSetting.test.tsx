/**
 * ChatExportSetting 组件测试
 *
 * 测试覆盖：
 * - 导出全部：成功路径、失败路径
 * - 导出已删除：成功路径、为空路径、失败路径
 * - Loading 状态：按钮 disabled 行为
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ChatExportSetting from '@/pages/Setting/components/GeneralSetting/components/ChatExportSetting';
import { renderWithProviders } from '../../helpers/render/redux';
import { exportAllChats, exportDeletedChats } from '@/services/chatExport';
import { toastQueue } from '@/services/toast';

// Mock react-i18next because component depends on translation keys
vi.mock('react-i18next', () => globalThis.__mockI18n({
  setting: {
    chatExport: {
      title: '聊天导出',
      description: '导出聊天数据为 JSON 文件',
      exportAll: '导出所有聊天',
      exportDeleted: '导出已删除聊天',
      exportSuccess: '导出成功',
      exportFailed: '导出失败',
      noDeletedChats: '没有已删除的聊天',
    },
  },
}));

// Mock @/services/toast because toast side effects should not render real UI
vi.mock('@/services/toast', () => ({
  toastQueue: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock @/services/chatExport because storage access should be isolated in component tests
vi.mock('@/services/chatExport', () => ({
  exportAllChats: vi.fn(),
  exportDeletedChats: vi.fn(),
}));

describe('ChatExportSetting', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL/URL.revokeObjectURL because file download uses Blob URLs
    mockCreateObjectURL = vi.fn(() => 'blob:test-url');
    mockRevokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
  });

  describe('导出全部聊天', () => {
    it('应该触发下载并显示成功 toast 当导出成功', async () => {
      const testData = { chats: [{ id: '1' } as any], exportedAt: '2024-01-01', version: '1.0' };
      vi.mocked(exportAllChats).mockResolvedValueOnce(testData as any);

      renderWithProviders(<ChatExportSetting />);

      await fireEvent.click(screen.getByRole('button', { name: '导出所有聊天' }));

      await waitFor(() => {
        expect(exportAllChats).toHaveBeenCalledOnce();
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(toastQueue.success).toHaveBeenCalledWith('导出成功');
      });
    });

    it('应该显示错误 toast 并恢复 loading 当导出失败', async () => {
      vi.mocked(exportAllChats).mockRejectedValueOnce(new Error('网络错误'));

      renderWithProviders(<ChatExportSetting />);

      await fireEvent.click(screen.getByRole('button', { name: '导出所有聊天' }));

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出失败');
      });

      // loading 状态应恢复
      expect(screen.getByRole('button', { name: '导出所有聊天' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '导出已删除聊天' })).not.toBeDisabled();
    });
  });

  describe('导出已删除聊天', () => {
    it('应该触发下载并显示成功 toast 当有已删除聊天', async () => {
      const testData = { chats: [{ id: '1', isDeleted: true } as any], exportedAt: '2024-01-01', version: '1.0' };
      vi.mocked(exportDeletedChats).mockResolvedValueOnce(testData as any);

      renderWithProviders(<ChatExportSetting />);

      await fireEvent.click(screen.getByRole('button', { name: '导出已删除聊天' }));

      await waitFor(() => {
        expect(exportDeletedChats).toHaveBeenCalledOnce();
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(toastQueue.success).toHaveBeenCalledWith('导出成功');
      });
    });

    it('应该显示 info toast 且不触发下载 当已删除聊天为空', async () => {
      const emptyData = { chats: [], exportedAt: '2024-01-01', version: '1.0' };
      vi.mocked(exportDeletedChats).mockResolvedValueOnce(emptyData as any);

      renderWithProviders(<ChatExportSetting />);

      await fireEvent.click(screen.getByRole('button', { name: '导出已删除聊天' }));

      await waitFor(() => {
        expect(toastQueue.info).toHaveBeenCalledWith('没有已删除的聊天');
      });

      // 不应触发文件下载
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(toastQueue.success).not.toHaveBeenCalled();
    });

    it('应该显示错误 toast 并恢复 loading 当导出失败', async () => {
      vi.mocked(exportDeletedChats).mockRejectedValueOnce(new Error('读取失败'));

      renderWithProviders(<ChatExportSetting />);

      await fireEvent.click(screen.getByRole('button', { name: '导出已删除聊天' }));

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出失败');
      });

      // loading 状态应恢复
      expect(screen.getByRole('button', { name: '导出所有聊天' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '导出已删除聊天' })).not.toBeDisabled();
    });
  });

  describe('Loading 状态', () => {
    it('应该禁用两个按钮 当导出请求进行中', async () => {
      let resolveExport!: (value: unknown) => void;
      vi.mocked(exportAllChats).mockImplementation(
        () => new Promise((resolve) => { resolveExport = resolve; }),
      );

      renderWithProviders(<ChatExportSetting />);

      const exportAllBtn = screen.getByRole('button', { name: '导出所有聊天' });
      const exportDeletedBtn = screen.getByRole('button', { name: '导出已删除聊天' });

      fireEvent.click(exportAllBtn);

      // 导出进行中，两个按钮都应禁用
      await waitFor(() => {
        expect(exportAllBtn).toBeDisabled();
        expect(exportDeletedBtn).toBeDisabled();
      });

      // 完成导出
      resolveExport({ chats: [], exportedAt: '', version: '' });

      // 按钮应恢复可用
      await waitFor(() => {
        expect(exportAllBtn).not.toBeDisabled();
        expect(exportDeletedBtn).not.toBeDisabled();
      });
    });
  });
});
