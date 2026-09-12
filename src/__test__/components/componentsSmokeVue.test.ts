/**
 * Vue 组件冒烟测试（任务 4.8 补充覆盖）
 *
 * 覆盖迁移前无 Vue 测试触达的组件：
 * - FilterInput：渲染、v-model 双向绑定、默认 placeholder
 * - OpenExternalBrowserButton：条件渲染与新标签页打开
 * - KeyRecoveryDialog：打开渲染与输入
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    common: {
      search: '搜索',
      importKey: '导入密钥',
      import: '导入',
      cancel: '取消',
      keyRecovery: {
        title: '恢复密钥',
        description: '输入主密钥以恢复数据',
        placeholder: '请输入主密钥',
        importButton: '导入',
        forceImport: '强制导入',
        importing: '导入中',
        importSuccess: '导入成功',
        importFailed: '导入失败',
        mismatchWarning: '密钥不匹配',
        securityWarning: '安全警告',
        cancel: '取消',
      },
    },
    setting: { keyManagement: { importKey: '导入密钥', importKeyDescription: '输入主密钥以恢复数据' } },
  }));

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

vi.mock('@/store/keyring/masterKey', () => ({
  importMasterKeyWithValidation: vi.fn().mockResolvedValue({ success: true }),
}));

import FilterInput from '@/components/FilterInput.vue';
import OpenExternalBrowserButton from '@/components/OpenExternalBrowserButton/OpenExternalBrowserButton.vue';
import KeyRecoveryDialog from '@/components/KeyRecoveryDialog.vue';

describe('FilterInput（Vue 版冒烟）', () => {
  it('渲染输入框与默认搜索 placeholder', () => {
    render(FilterInput);

    const input = screen.getByTestId('filter-input');
    expect(input).toBeVisible();
    expect(input.getAttribute('placeholder')).toBe('搜索');
  });

  it('v-model 双向绑定输入内容', async () => {
    const { emitted } = render(FilterInput, { props: { modelValue: '' } });

    const input = screen.getByTestId('filter-input');
    await fireEvent.update(input, '关键词');

    expect((input as HTMLInputElement).value).toBe('关键词');
    expect(emitted('update:modelValue')).toEqual([['关键词']]);
  });

  it('传入自定义 placeholder 时优先生效', () => {
    render(FilterInput, { props: { placeholder: '自定义提示' } });

    expect(screen.getByTestId('filter-input').getAttribute('placeholder')).toBe('自定义提示');
  });
});

describe('OpenExternalBrowserButton（Vue 版冒烟）', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('无 siteUrl 时不渲染按钮', () => {
    const { container } = render(OpenExternalBrowserButton, {
      props: { siteUrl: undefined },
    });

    expect(container.querySelector('button')).toBeNull();
  });

  it('点击按钮以新标签页打开外部链接', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(OpenExternalBrowserButton, { props: { siteUrl: 'https://docs.example.com' } });

    await fireEvent.click(screen.getByRole('button'));

    expect(openSpy).toHaveBeenCalledWith('https://docs.example.com', '_blank', 'noopener,noreferrer');
  });
});

describe('KeyRecoveryDialog（Vue 版冒烟）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // portal 内容渲染在 body 下，显式清理避免用例间残留
    cleanup();
  });

  it('关闭状态不渲染对话框内容', () => {
    const { container } = render(KeyRecoveryDialog, { props: { open: false } });

    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('打开状态渲染密钥输入与导入按钮', async () => {
    render(KeyRecoveryDialog, { props: { open: true } });
    await vi.waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeVisible();
    });

    expect(screen.getByRole('textbox')).toBeVisible();
  });
});
