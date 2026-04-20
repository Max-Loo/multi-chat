/**
 * KeyRecoveryDialog 组件测试
 *
 * 验证对话框渲染、输入、导入流程和验证失败二次确认
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { KeyRecoveryDialog } from '@/components/KeyRecoveryDialog';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (fn: (arg: any) => string) => {
      const proxy = new Proxy({} as Record<string, string>, {
        get: (_, prop: string) => prop,
      });
      return fn({ common: { keyRecovery: proxy, cancel: 'mockCancel' } });
    },
    i18n: { language: 'zh' },
  }),
}));

// Mock importMasterKeyWithValidation
vi.mock('@/store/keyring/masterKey', () => ({
  importMasterKeyWithValidation: vi.fn(),
}));

import { importMasterKeyWithValidation } from '@/store/keyring/masterKey';

describe('KeyRecoveryDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  /** 获取第一个匹配文本的 button 元素 */
  const getFirstButtonByText = (text: string) => {
    const els = screen.getAllByText(text).filter(el => el.tagName === 'BUTTON');
    return els[0];
  };

  /** 输入密钥并确保状态更新 */
  const typeKey = (value: string) => {
    const inputs = screen.getAllByPlaceholderText('placeholder');
    act(() => {
      fireEvent.change(inputs[0], { target: { value } });
    });
  };

  /** 点击按钮 */
  const clickButton = (text: string) => {
    act(() => {
      fireEvent.click(getFirstButtonByText(text));
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('应该渲染对话框内容 当打开时', () => {
    render(<KeyRecoveryDialog {...defaultProps} />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByText('securityWarning')).toBeInTheDocument();
    expect(getFirstButtonByText('importButton')).toBeTruthy();
  });

  it('应该禁用导入按钮 当输入为空', () => {
    render(<KeyRecoveryDialog {...defaultProps} />);

    expect(getFirstButtonByText('importButton')).toBeDisabled();
  });

  it('应该启用导入按钮 当输入非空', () => {
    render(<KeyRecoveryDialog {...defaultProps} />);

    typeKey('a'.repeat(64));

    expect(getFirstButtonByText('importButton')).not.toBeDisabled();
  });

  it('应该调用 importMasterKeyWithValidation 并 reload 当验证通过', async () => {
    vi.mocked(importMasterKeyWithValidation).mockResolvedValue({
      success: true,
      keyMatched: true,
    });
    const reloadSpy = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ reload: reloadSpy } as any);

    render(<KeyRecoveryDialog {...defaultProps} />);

    typeKey('a'.repeat(64));
    clickButton('importButton');

    await waitFor(() => {
      expect(importMasterKeyWithValidation).toHaveBeenCalledWith('a'.repeat(64), false);
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  it('应该显示二次确认 当密钥不匹配', async () => {
    vi.mocked(importMasterKeyWithValidation).mockResolvedValue({ success: false, keyMatched: false });

    render(<KeyRecoveryDialog {...defaultProps} />);

    typeKey('a'.repeat(64));
    clickButton('importButton');

    await waitFor(() => {
      expect(screen.getByText('mismatchWarning')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(getFirstButtonByText('forceImport')).toBeTruthy();
  });

  it('应该显示错误信息 当导入失败', async () => {
    vi.mocked(importMasterKeyWithValidation).mockResolvedValue({
      success: false,
      keyMatched: null,
      error: '密钥导入失败，无法写入安全存储',
    });

    render(<KeyRecoveryDialog {...defaultProps} />);

    typeKey('a'.repeat(64));
    clickButton('importButton');

    await waitFor(() => {
      expect(screen.getByText('密钥导入失败，无法写入安全存储')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
