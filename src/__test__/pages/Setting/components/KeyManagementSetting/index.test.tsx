import { screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/__test__/helpers/render/redux';
import KeyManagementSetting from '@/pages/Setting/components/KeyManagementSetting';
import { toastQueue } from '@/services/toast';

// Mock react-i18next
vi.mock('react-i18next', () => globalThis.__mockI18n({
  common: {
    hide: '隐藏',
  },
  setting: {
    keyManagement: {
      exportKey: '导出密钥',
      exportKeyDescription: '导出密钥描述',
      exportKeyDialogDescription: '密钥对话框描述',
      exportSuccess: '复制成功',
      exportFailed: '导出失败',
      copyToClipboard: '复制到剪贴板',
      resetAllData: '重置所有数据',
      resetAllDataDescription: '重置数据描述',
    },
  },
}));

// Mock useScrollContainer 避免真实 DOM 测量
vi.mock('@/hooks/useScrollContainer', () => ({
  useScrollContainer: () => ({
    scrollContainerRef: { current: null },
    scrollbarClassname: '',
  }),
}));

// Mock exportMasterKey
const mockExportMasterKey = vi.fn();
vi.mock('@/store/keyring/masterKey', () => ({
  exportMasterKey: (...args: unknown[]) => mockExportMasterKey(...args),
}));

// Mock copyToClipboard
const mockCopyToClipboard = vi.fn();
vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args),
}));

// Mock resetAllData
const mockResetAllData = vi.fn();
vi.mock('@/utils/resetAllData', () => ({
  resetAllData: (...args: unknown[]) => mockResetAllData(...args),
}));

// Mock toast
vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

const renderKeyManagement = () => renderWithProviders(<KeyManagementSetting />);

describe('KeyManagementSetting', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  describe('密钥导出成功流程', () => {
    it('应该显示密钥内容 当导出成功时', async () => {
      mockExportMasterKey.mockResolvedValue('test-master-key-abc');
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-master-key-abc')).toBeInTheDocument();
      });
    });

    it('应该禁用导出按钮 当正在导出时', async () => {
      mockExportMasterKey.mockReturnValue(new Promise(() => {}));
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(exportButtons[0]).toBeDisabled();
      });
    });
  });

  describe('密钥导出失败流程', () => {
    it('应该显示错误 toast 当导出失败时', async () => {
      mockExportMasterKey.mockRejectedValue(new Error('导出失败'));
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出失败');
      });
    });
  });

  describe('密钥复制成功流程', () => {
    it('应该调用 copyToClipboard 并关闭对话框 当复制成功时', async () => {
      mockExportMasterKey.mockResolvedValue('test-key');
      mockCopyToClipboard.mockResolvedValue(undefined);
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: '复制到剪贴板' });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith('test-key');
      });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '复制到剪贴板' })).not.toBeInTheDocument();
      });
    });
  });

  describe('导出加载中状态', () => {
    it('应该显示取消文本和禁用操作按钮 当正在导出时', async () => {
      mockExportMasterKey.mockReturnValue(new Promise(() => {}));
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: '取消' });
        expect(cancelButton).toBeInTheDocument();
      });

      const disabledActionButton = screen.getByRole('button', { name: '...' });
      expect(disabledActionButton).toBeDisabled();
    });
  });

  describe('导出成功后取消关闭对话框', () => {
    it('应该关闭对话框 当导出成功后点击隐藏按钮', async () => {
      mockExportMasterKey.mockResolvedValue('test-key-cancel');
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-key-cancel')).toBeInTheDocument();
      });

      const hideButton = screen.getByRole('button', { name: '隐藏' });
      fireEvent.click(hideButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('test-key-cancel')).not.toBeInTheDocument();
      });
    });
  });

  describe('密钥复制失败流程', () => {
    it('应该显示错误 toast 当复制失败时', async () => {
      mockExportMasterKey.mockResolvedValue('test-key');
      mockCopyToClipboard.mockRejectedValue(new Error('复制失败'));
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: '复制到剪贴板' });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出失败');
      });
    });

    it('应该保持对话框打开 当复制失败时', async () => {
      mockExportMasterKey.mockResolvedValue('test-key-copy-fail');
      mockCopyToClipboard.mockRejectedValue(new Error('复制失败'));
      renderKeyManagement();

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-key-copy-fail')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: '复制到剪贴板' });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出失败');
      });

      expect(screen.getByDisplayValue('test-key-copy-fail')).toBeInTheDocument();
    });
  });

  describe('数据重置对话框集成', () => {
    it('应该打开重置确认对话框 当点击重置按钮时', async () => {
      mockResetAllData.mockResolvedValue(undefined);
      renderKeyManagement();

      const resetButton = screen.getByRole('button', { name: '重置所有数据' });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('应该调用 resetAllData 并刷新页面 当确认重置时', async () => {
      mockResetAllData.mockResolvedValue(undefined);
      renderKeyManagement();

      const resetButton = screen.getByRole('button', { name: '重置所有数据' });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '确认重置' })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: '确认重置' });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockResetAllData).toHaveBeenCalledTimes(1);
      });

      expect(window.location.reload).toHaveBeenCalled();
    });
  });
});
