/**
 * KeyManagementSetting 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../KeyManagementSetting/index.test.tsx，保留核心语义：
 * - 密钥导出成功：显示密钥内容、导出中禁用按钮
 * - 密钥导出失败：错误 toast
 * - 复制成功：调用剪贴板并关闭对话框
 * - 复制失败：错误 toast 且保持打开
 * - 数据重置对话框：确认后调用 resetAllData
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

const mocks = vi.hoisted(() => ({
  exportMasterKey: vi.fn(),
  copyToClipboard: vi.fn(),
  resetAllData: vi.fn(),
}));

vi.mock('@/store/keyring/masterKey', () => ({
  exportMasterKey: (...args: unknown[]) => mocks.exportMasterKey(...(args as [])),
}));

vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: (...args: unknown[]) => mocks.copyToClipboard(...(args as [])),
}));

vi.mock('@/utils/resetAllData', () => ({
  resetAllData: (...args: unknown[]) => mocks.resetAllData(...(args as [])),
}));

// window.location.reload 不可直接赋值，stub
const reloadSpy = vi.fn();
vi.stubGlobal('location', { ...window.location, reload: reloadSpy });

import KeyManagementSetting from '@/pages/Setting/components/KeyManagementSetting/index.vue';
import { toastQueue } from '@/services/toast';

/** 渲染 KeyManagementSetting */
function renderKeyManagement() {
  return render(KeyManagementSetting);
}

/** 获取「导出密钥」操作按钮（页面同时存在同名标题） */
function getExportButton(): HTMLElement {
  const button = screen
    .getAllByText('导出密钥')
    .map((el) => el.closest('button'))
    .find((b): b is HTMLButtonElement => b !== null);
  if (!button) throw new Error('导出密钥按钮不存在');
  return button;
}

/** 获取「重置所有数据」操作按钮（页面同时存在同名标题） */
function getResetButton(): HTMLElement {
  const button = screen
    .getAllByText('重置所有数据')
    .map((el) => el.closest('button'))
    .find((b): b is HTMLButtonElement => b !== null);
  if (!button) throw new Error('重置所有数据按钮不存在');
  return button;
}

describe('KeyManagementSetting（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.copyToClipboard.mockResolvedValue(undefined);
    mocks.resetAllData.mockResolvedValue(undefined);
  });

  describe('密钥导出成功流程', () => {
    it('应该显示密钥内容 当导出成功时', async () => {
      mocks.exportMasterKey.mockResolvedValue('sk-master-key-abc123');
      renderKeyManagement();

      await fireEvent.click(getExportButton());

      await waitFor(() => {
        const input = screen.getByDisplayValue('sk-master-key-abc123');
        expect(input).toBeInTheDocument();
      });
    });

    it('应该禁用导出按钮 当正在导出时', async () => {
      // 对象包装规避 TS 控制流收窄
      const pending: { resolve: ((key: string) => void) | null } = {
        resolve: null,
      };
      mocks.exportMasterKey.mockReturnValue(
        new Promise<string>((resolve) => {
          pending.resolve = resolve;
        }),
      );
      renderKeyManagement();

      await fireEvent.click(getExportButton());

      expect(getExportButton()).toBeDisabled();

      // 收尾
      pending.resolve?.('sk-key');
    });
  });

  describe('密钥导出失败流程', () => {
    it('应该显示错误 toast 当导出失败时', async () => {
      mocks.exportMasterKey.mockRejectedValue(new Error('export failed'));
      renderKeyManagement();

      await fireEvent.click(getExportButton());

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出密钥失败');
      });
    });
  });

  describe('密钥复制流程', () => {
    it('应该调用 copyToClipboard 并关闭对话框 当复制成功时', async () => {
      mocks.exportMasterKey.mockResolvedValue('sk-master-key-abc123');
      renderKeyManagement();

      await fireEvent.click(getExportButton());
      await screen.findByDisplayValue('sk-master-key-abc123');

      await fireEvent.click(screen.getByText('复制到剪贴板'));

      expect(mocks.copyToClipboard).toHaveBeenCalledWith('sk-master-key-abc123');
      await waitFor(() => {
        expect(toastQueue.success).toHaveBeenCalledWith('密钥已复制到剪贴板');
        expect(
          screen.queryByDisplayValue('sk-master-key-abc123'),
        ).not.toBeInTheDocument();
      });
    });

    it('应该显示错误 toast 且保持对话框打开 当复制失败时', async () => {
      mocks.exportMasterKey.mockResolvedValue('sk-master-key-abc123');
      mocks.copyToClipboard.mockRejectedValue(new Error('copy failed'));
      renderKeyManagement();

      await fireEvent.click(getExportButton());
      await screen.findByDisplayValue('sk-master-key-abc123');

      await fireEvent.click(screen.getByText('复制到剪贴板'));

      await waitFor(() => {
        expect(toastQueue.error).toHaveBeenCalledWith('导出密钥失败');
      });
      expect(
        screen.getByDisplayValue('sk-master-key-abc123'),
      ).toBeInTheDocument();
    });
  });

  describe('数据重置对话框集成', () => {
    it('应该打开重置确认对话框 当点击重置按钮时', async () => {
      renderKeyManagement();

      await fireEvent.click(getResetButton());

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('应该调用 resetAllData 并刷新页面 当确认重置时', async () => {
      renderKeyManagement();

      await fireEvent.click(getResetButton());
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      // 点击确认（ResetDataDialog 内 AlertDialogAction 按钮）
      const confirmButton = await screen.findByText('确认重置');
      await fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mocks.resetAllData).toHaveBeenCalled();
        expect(reloadSpy).toHaveBeenCalled();
      });
    });
  });
});
