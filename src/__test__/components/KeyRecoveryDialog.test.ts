/**
 * KeyRecoveryDialog 组件测试
 *
 * 验证打开渲染、导入按钮状态、成功/不匹配/失败三种结果路径
 */

import { nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { KeyRecoveryDialog } from '@/components/KeyRecoveryDialog';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: {
        cancel: '取消',
        keyRecovery: {
          title: '导入密钥',
          description: '输入您的备份密钥以恢复加密数据',
          placeholder: '请输入 64 字符的 hex 编码密钥',
          importButton: '导入',
          importing: '导入中...',
          importSuccess: '密钥导入成功，正在重新加载...',
          securityWarning: '密钥是敏感信息',
          mismatchWarning: '导入的密钥无法解密现有数据',
          importFailed: '密钥导入失败，请重试',
          forceImport: '仍然导入',
        },
      },
    }).useTranslation(),
}));

const masterKeyMock = vi.hoisted(() => ({ importMasterKeyWithValidation: vi.fn() }));

vi.mock('@/store/keyring/masterKey', () => masterKeyMock);

const toastMock = vi.hoisted(() => ({
  toastQueue: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/toast', () => toastMock);

/** 打开对话框并输入密钥 */
async function openWithInput(input: string) {
  render(KeyRecoveryDialog, { props: { open: true } });
  await nextTick();
  const inputEl = screen.getByPlaceholderText('请输入 64 字符的 hex 编码密钥');
  await fireEvent.update(inputEl, input);
}

describe('KeyRecoveryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window.location, 'reload').mockImplementation(() => {});
  });

  it('打开时应该渲染对话框标题与描述', async () => {
    render(KeyRecoveryDialog, { props: { open: true } });
    await nextTick();

    expect(screen.getByText('导入密钥')).toBeInTheDocument();
    expect(screen.getByText('输入您的备份密钥以恢复加密数据')).toBeInTheDocument();
  });

  it('输入为空时导入按钮应禁用', async () => {
    render(KeyRecoveryDialog, { props: { open: true } });
    await nextTick();

    expect(screen.getByRole('button', { name: '导入' })).toBeDisabled();
  });

  it('输入非空时导入按钮应启用', async () => {
    await openWithInput('a'.repeat(64));

    expect(screen.getByRole('button', { name: '导入' })).toBeEnabled();
  });

  it('验证通过时应该提示成功并刷新页面', async () => {
    masterKeyMock.importMasterKeyWithValidation.mockResolvedValue({ success: true });
    const onUpdateOpen = vi.fn();

    render(KeyRecoveryDialog, {
      props: { open: true, 'onUpdate:open': onUpdateOpen },
    });
    await nextTick();
    await fireEvent.update(
      screen.getByPlaceholderText('请输入 64 字符的 hex 编码密钥'),
      'k'.repeat(64),
    );
    await fireEvent.click(screen.getByRole('button', { name: '导入' }));

    await waitFor(() => {
      expect(masterKeyMock.importMasterKeyWithValidation).toHaveBeenCalledWith(
        'k'.repeat(64),
        false,
      );
      expect(toastMock.toastQueue.success).toHaveBeenCalledWith(
        '密钥导入成功，正在重新加载...',
      );
      expect(window.location.reload).toHaveBeenCalled();
      expect(onUpdateOpen).toHaveBeenCalledWith(false);
    });
  });

  it('密钥不匹配时应该显示警告与二次确认（仍然导入）', async () => {
    masterKeyMock.importMasterKeyWithValidation.mockResolvedValue({
      success: false,
      keyMatched: false,
    });

    await openWithInput('m'.repeat(64));
    await fireEvent.click(screen.getByRole('button', { name: '导入' }));

    await waitFor(() => {
      expect(screen.getByText('导入的密钥无法解密现有数据')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '仍然导入' })).toBeInTheDocument();
    });
  });

  it('导入失败时应该显示错误信息', async () => {
    masterKeyMock.importMasterKeyWithValidation.mockRejectedValue(
      new Error('boom'),
    );

    await openWithInput('e'.repeat(64));
    await fireEvent.click(screen.getByRole('button', { name: '导入' }));

    await waitFor(() => {
      expect(screen.getByText('密钥导入失败，请重试')).toBeInTheDocument();
    });
  });
});
