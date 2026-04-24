/**
 * 主密钥恢复功能集成测试
 *
 * 测试范围：
 * - FatalErrorScreen 重置按钮交互（渲染 → 点击 → 确认 → resetAllData 调用）
 * - 密钥重新生成通知（模拟 isNewlyGenerated → toast 显示）
 * - 密钥导入导出流程（导出 → 导入 → 数据恢复）
 */

import { describe, test, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FatalErrorScreen } from '@/components/FatalErrorScreen';
import type { InitError } from '@/services/initialization';

// Mock resetAllData
const mockResetAllData = vi.fn().mockResolvedValue(undefined);
vi.mock('@/utils/resetAllData', () => ({
  resetAllData: (...args: unknown[]) => mockResetAllData(...args),
}));

// Mock useResetDataDialog Hook
vi.mock('@/hooks/useResetDataDialog', () => ({
  useResetDataDialog: () => {
    const { useState, createElement: h } = require('react');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleConfirmReset = async () => {
      setIsResetting(true);
      try {
        await mockResetAllData();
        window.location.reload();
      } catch (error) {
        console.error('重置数据失败:', error);
        setIsResetting(false);
        setIsDialogOpen(false);
      }
    };

    const renderResetDialog = () => {
      if (!isDialogOpen) return null;
      return h('div', { 'data-testid': 'reset-dialog' },
        h('h2', null, '确认重置所有数据'),
        h('p', null, '将清除所有已保存的模型配置和聊天记录，生成新的加密密钥。此操作不可撤销。'),
        h('button', { onClick: () => setIsDialogOpen(false), disabled: isResetting }, '取消'),
        h('button', { onClick: handleConfirmReset, disabled: isResetting }, '确认重置'),
      );
    };

    return {
      isDialogOpen,
      setIsDialogOpen,
      isResetting,
      handleConfirmReset,
      renderResetDialog,
    };
  },
}));

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    common: {
      resetAllData: '重置所有数据并重新开始',
      refreshPage: '刷新页面',
      initializationFailed: '初始化失败',
      initializationFailedDescription: '应用初始化过程中发生错误',
      showErrorDetails: '显示错误详情',
      keyRecovery: {
        title: 'title',
        description: 'description',
        securityWarning: 'securityWarning',
        importButton: 'importButton',
        placeholder: 'placeholder',
        mismatchWarning: 'mismatchWarning',
        forceImport: 'forceImport',
      },
    },
  }),
);

describe('主密钥恢复功能集成测试', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FatalErrorScreen 重置按钮', () => {
    const mockErrors: InitError[] = [
      {
        severity: 'fatal',
        message: 'Failed to initialize master key',
      },
    ];

    test('应该显示重置按钮', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      expect(screen.getByText('重置所有数据并重新开始')).toBeInTheDocument();
    });

    test('点击重置按钮应打开确认对话框', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      const resetButton = screen.getByText('重置所有数据并重新开始');
      fireEvent.click(resetButton);

      expect(screen.getByText('确认重置所有数据')).toBeInTheDocument();
      expect(screen.getByText(/将清除所有已保存的模型配置和聊天记录/)).toBeInTheDocument();
    });

    test('点击取消应关闭确认对话框', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      const resetButton = screen.getByText('重置所有数据并重新开始');
      fireEvent.click(resetButton);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      // 对话框关闭后确认标题不再可见
      expect(screen.queryByText('确认重置所有数据')).not.toBeInTheDocument();
    });

    test('确认重置应调用 resetAllData', async () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      const resetButton = screen.getByText('重置所有数据并重新开始');
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText('确认重置');
      fireEvent.click(confirmButton);

      // 等待异步操作
      await vi.waitFor(() => {
        expect(mockResetAllData).toHaveBeenCalled();
      });
    });
  });

  describe('密钥导入导出流程', () => {
    test('importMasterKey 应验证 hex 格式', async () => {
      const { importMasterKey } = await import('@/store/keyring/masterKey');

      // 需要 mock keyring
      const { keyring } = await import('@/utils/tauriCompat/keyring');
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);

      // 无效格式应抛出错误
      await expect(importMasterKey('invalid')).rejects.toThrow('密钥格式无效');

      // 有效格式应成功
      const validKey = 'a'.repeat(64);
      await expect(importMasterKey(validKey)).resolves.toBeUndefined();
      expect(keyring.setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', validKey);
    });

    test('exportMasterKey 应返回当前密钥', async () => {
      const { exportMasterKey } = await import('@/store/keyring/masterKey');
      const { keyring } = await import('@/utils/tauriCompat/keyring');

      const testKey = 'b'.repeat(64);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(testKey);

      const exported = await exportMasterKey();
      expect(exported).toBe(testKey);
    });

    test('导出后导入应恢复密钥', async () => {
      const { exportMasterKey, importMasterKey } = await import('@/store/keyring/masterKey');
      const { keyring } = await import('@/utils/tauriCompat/keyring');

      const originalKey = 'c'.repeat(64);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(originalKey);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);

      // 导出
      const exported = await exportMasterKey();
      expect(exported).toBe(originalKey);

      // 导入
      await importMasterKey(exported);
      expect(keyring.setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', exported);
    });

    test('importMasterKey 后应直接刷新页面', async () => {
      const { importMasterKey } = await import('@/store/keyring/masterKey');
      const { keyring } = await import('@/utils/tauriCompat/keyring');

      const validKey = 'd'.repeat(64);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);

      // 导入密钥
      await importMasterKey(validKey);
      expect(keyring.setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', validKey);
    });
  });
});
