/**
 * MainApp 组件测试
 *
 * 验证 decryptionFailureCount Toast 行为和 KeyRecoveryDialog 触发
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createMainApp } from '@/MainApp';
import type { InitResult } from '@/services/initialization';
import { hasEncryptedModels } from '@/store/storage/modelStorage';

// Mock toastQueue
vi.mock('@/services/toast', () => ({
  toastQueue: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (fn: (k: unknown) => string) => {
      const mockObj = {
        common: {
          decryptionFailureMessage: '2 个模型的 API Key 无法解密',
          decryptionFailureImport: '导入密钥',
          decryptionFailureDismiss: '我知道了',
          masterKeyRegeneratedMessage: '密钥已重新生成',
          masterKeyRegeneratedImport: '导入密钥',
          masterKeyRegeneratedDismiss: '我知道了',
        },
      };
      try {
        return fn(mockObj as unknown);
      } catch {
        return 'mocked';
      }
    },
    i18n: { language: 'zh' },
  }),
}));

// Mock router - 使用 createMemoryRouter 避免浏览器历史依赖
vi.mock('@/router', async () => {
  const { createMemoryRouter } = await import('react-router-dom');
  const React = await import('react');
  const router = createMemoryRouter([
    { path: '/', element: React.createElement('div', { 'data-testid': 'home' }, 'Home') },
  ]);
  return { default: router };
});

// Mock ToasterWrapper
vi.mock('@/services/toast/ToasterWrapper', () => ({
  ToasterWrapper: () => <div data-testid="toaster-wrapper">Toaster</div>,
}));

// Mock KeyRecoveryDialog
vi.mock('@/components/KeyRecoveryDialog', () => ({
  KeyRecoveryDialog: ({ open }: { open: boolean }) => (
    <div data-testid="key-recovery-dialog">{open ? 'open' : 'closed'}</div>
  ),
}));

// Mock other side effects
vi.mock('@/store/keyring/masterKey', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/keyring/masterKey')>();
  return {
    ...actual,
    handleSecurityWarning: vi.fn(),
  };
});

vi.mock('@/store/storage/modelStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/storage/modelStorage')>();
  return {
    ...actual,
    hasEncryptedModels: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('@/store/slices/modelProviderSlice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/slices/modelProviderSlice')>();
  return {
    ...actual,
    triggerSilentRefreshIfNeeded: vi.fn(),
  };
});

import { toastQueue } from '@/services/toast';

const createMockResult = (overrides: Partial<InitResult> = {}): InitResult => ({
  success: true,
  fatalErrors: [],
  warnings: [],
  ignorableErrors: [],
  completedSteps: [],
  ...overrides,
});

describe('MainApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该在 decryptionFailureCount > 0 时显示 Toast 警告', () => {
    const MainApp = createMainApp(createMockResult({ decryptionFailureCount: 2 }));
    render(<MainApp />);

    expect(toastQueue.warning).toHaveBeenCalledTimes(1);
    expect(toastQueue.warning).toHaveBeenCalledWith(
      '2 个模型的 API Key 无法解密',
      expect.objectContaining({
        duration: Infinity,
        action: expect.objectContaining({
          label: '导入密钥',
          onClick: expect.any(Function),
        }),
        cancel: expect.objectContaining({
          label: '我知道了',
          onClick: expect.any(Function),
        }),
      }),
    );
  });

  it('应该打开 KeyRecoveryDialog 当 Toast 导入按钮被点击', () => {
    const MainApp = createMainApp(createMockResult({ decryptionFailureCount: 1 }));
    render(<MainApp />);

    const callArgs = vi.mocked(toastQueue.warning).mock.calls[0];
    const options = callArgs[1] as unknown as { action: { onClick: () => void } };

    // 调用 action onClick 应该打开 dialog
    act(() => {
      options.action.onClick();
    });

    const dialogs = screen.queryAllByTestId('key-recovery-dialog');
    expect(dialogs.some((el) => el.textContent === 'open')).toBe(true);
  });

  it('应该只显示解密失败通知 当 masterKeyRegenerated 和 decryptionFailureCount 同时存在', () => {
    const MainApp = createMainApp(
      createMockResult({
        decryptionFailureCount: 1,
        masterKeyRegenerated: true,
      }),
    );
    render(<MainApp />);

    // 只应调用一次 warning（解密失败通知）
    expect(toastQueue.warning).toHaveBeenCalledTimes(1);
    expect(toastQueue.warning).toHaveBeenCalledWith(
      '2 个模型的 API Key 无法解密',
      expect.anything(),
    );
  });

  it('应该显示 masterKeyRegenerated Toast 当只有 masterKeyRegenerated 为 true', async () => {
    vi.mocked(hasEncryptedModels).mockResolvedValue(true);

    const MainApp = createMainApp(
      createMockResult({ masterKeyRegenerated: true }),
    );
    render(<MainApp />);

    // 等待异步的 hasEncryptedModels
    await vi.waitFor(() => {
      expect(toastQueue.warning).toHaveBeenCalledWith(
        '密钥已重新生成',
        expect.objectContaining({
          duration: Infinity,
        }),
      );
    });
  });

  it('不应该显示任何通知 当没有解密失败且没有重新生成密钥', () => {
    const MainApp = createMainApp(createMockResult());
    render(<MainApp />);

    expect(toastQueue.warning).not.toHaveBeenCalled();
  });
});
