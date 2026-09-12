/**
 * Vue KeyManagementSetting 页测试
 *
 * 行为基线与迁移前 React 版一致：
 * - 导出密钥：成功展示、进行中禁用、失败提示
 * - 复制密钥：成功关闭对话框、失败保持打开
 * - 重置数据：确认后调用 resetAllData 并刷新页面
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    common: { hide: '隐藏', cancel: '取消', resetConfirmTitle: '确认重置', resetConfirmDescription: '此操作将清除所有数据', resetConfirmAction: '确认重置' },
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

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

vi.mock('@/store/keyring/masterKey', () => ({
  exportMasterKey: vi.fn(),
}));

vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
}));

vi.mock('@/utils/resetAllData', () => ({
  resetAllData: vi.fn(),
}));

import KeyManagementSetting from '@/pages/Setting/components/KeyManagementSetting.vue';
import { toastQueue } from '@/services/toast';
import { exportMasterKey } from '@/store/keyring/masterKey';
import { copyToClipboard } from '@/utils/clipboard';
import { resetAllData } from '@/utils/resetAllData';

/** 点击「导出密钥」主按钮（页面文案有两处，第一处为操作按钮） */
const clickExportButton = async () => {
  const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
  await fireEvent.click(exportButtons[0]);
};

describe('KeyManagementSetting（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  describe('密钥导出流程', () => {
    it('导出成功后展示密钥内容', async () => {
      vi.mocked(exportMasterKey).mockResolvedValue('test-master-key-abc');
      render(KeyManagementSetting);

      await clickExportButton();

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-master-key-abc')).toBeInTheDocument();
      });
    });

    it('导出进行中时禁用导出按钮', async () => {
      vi.mocked(exportMasterKey).mockReturnValue(new Promise(() => {}));
      render(KeyManagementSetting);

      const exportButtons = screen.getAllByRole('button', { name: '导出密钥' });
      await fireEvent.click(exportButtons[0]);

      await waitFor(() => {
        expect(exportButtons[0]).toBeDisabled();
      });
    });

    it('导出失败时显示错误 Toast', async () => {
      vi.mocked(exportMasterKey).mockRejectedValue(new Error('导出失败'));
      render(KeyManagementSetting);

      await clickExportButton();

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出失败');
      });
    });
  });

  describe('密钥复制流程', () => {
    it('复制成功后关闭对话框', async () => {
      vi.mocked(exportMasterKey).mockResolvedValue('test-key');
      vi.mocked(copyToClipboard).mockResolvedValue(undefined);
      render(KeyManagementSetting);

      await clickExportButton();
      await waitFor(() => {
        expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
      });

      await fireEvent.click(screen.getByRole('button', { name: '复制到剪贴板' }));

      await waitFor(() => {
        expect(copyToClipboard).toHaveBeenCalledWith('test-key');
        expect(screen.queryByRole('button', { name: '复制到剪贴板' })).not.toBeInTheDocument();
      });
    });

    it('复制失败时提示错误并保持对话框打开', async () => {
      vi.mocked(exportMasterKey).mockResolvedValue('test-key-copy-fail');
      vi.mocked(copyToClipboard).mockRejectedValue(new Error('复制失败'));
      render(KeyManagementSetting);

      await clickExportButton();
      await waitFor(() => {
        expect(screen.getByDisplayValue('test-key-copy-fail')).toBeInTheDocument();
      });

      await fireEvent.click(screen.getByRole('button', { name: '复制到剪贴板' }));

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出失败');
      });
      expect(screen.getByDisplayValue('test-key-copy-fail')).toBeInTheDocument();
    });
  });

  describe('导出加载中状态', () => {
    it('导出中显示取消按钮与禁用的占位操作按钮', async () => {
      vi.mocked(exportMasterKey).mockReturnValue(new Promise(() => {}));
      render(KeyManagementSetting);

      await clickExportButton();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
      });
      const disabledActionButton = screen.getByRole('button', { name: '...' });
      expect(disabledActionButton).toBeDisabled();
    });
  });

  describe('导出成功后关闭对话框', () => {
    it('点击隐藏按钮关闭对话框', async () => {
      vi.mocked(exportMasterKey).mockResolvedValue('test-key-cancel');
      render(KeyManagementSetting);

      await clickExportButton();
      await waitFor(() => {
        expect(screen.getByDisplayValue('test-key-cancel')).toBeInTheDocument();
      });

      await fireEvent.click(screen.getByRole('button', { name: '隐藏' }));

      await waitFor(() => {
        expect(screen.queryByDisplayValue('test-key-cancel')).not.toBeInTheDocument();
      });
    });
  });

  describe('数据重置流程', () => {
    it('点击重置按钮打开确认对话框', async () => {
      vi.mocked(resetAllData).mockResolvedValue(undefined);
      render(KeyManagementSetting);

      await fireEvent.click(screen.getByRole('button', { name: '重置所有数据' }));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('确认重置后调用 resetAllData 并刷新页面', async () => {
      vi.mocked(resetAllData).mockResolvedValue(undefined);
      render(KeyManagementSetting);

      await fireEvent.click(screen.getByRole('button', { name: '重置所有数据' }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '确认重置' })).toBeInTheDocument();
      });

      await fireEvent.click(screen.getByRole('button', { name: '确认重置' }));

      await waitFor(() => {
        expect(resetAllData).toHaveBeenCalledTimes(1);
        expect(window.location.reload).toHaveBeenCalled();
      });
    });
  });
});
