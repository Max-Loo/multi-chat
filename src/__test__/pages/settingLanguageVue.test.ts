/**
 * Vue LanguageSetting 组件测试
 *
 * 行为基线与迁移前 React 版一致：
 * - 渲染当前选中语言与全部语言选项
 * - 切换语言调用 store 的 setAppLanguage（内部处理 i18n 切换、持久化与 Toast）
 * - 相同语言或切换进行中时不重复触发
 * - className 透传
 *
 * Select 组件交互复杂，按 React 版策略使用简化 Mock
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({ common: { language: '语言' } }));

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

vi.mock('@/services/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/i18n')>();
  return {
    ...actual,
    changeAppLanguage: vi.fn().mockResolvedValue({ success: true }),
  };
});

// 简化 Mock Select，保留 update:modelValue 回调触发（模拟选择英文）
vi.mock('@/components/ui-vue/select', () => ({
  Select: {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <div data-testid="select" :data-value="modelValue" :data-disabled="String(disabled)">
        <button data-testid="toggle-language" @click="$emit('update:modelValue', 'en')">
          Toggle Language
        </button>
      </div>
    `,
  },
  SelectTrigger: { template: '<div data-testid="select-trigger" />', props: ['disabled'] },
  SelectValue: { template: '<div data-testid="select-value">Language Value</div>' },
  SelectContent: { template: '<div data-testid="select-content" /> ' },
  SelectItem: {
    props: ['value'],
    template: '<div :data-testid="`option-${value}`" :data-value="value" />',
  },
}));

import LanguageSetting from '@/pages/Setting/components/GeneralSetting/components/LanguageSetting.vue';
import { changeAppLanguage } from '@/services/i18n';
import { useAppConfigStore } from '@/store/pinia/appConfig';

describe('LanguageSetting（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(changeAppLanguage).mockResolvedValue({ success: true } as never);
  });

  it('渲染语言标签与当前选中语言', () => {
    const store = useAppConfigStore();
    store.language = 'zh';
    render(LanguageSetting);

    expect(screen.getByTestId('language-setting')).toBeVisible();
    expect(screen.getByText('语言')).toBeVisible();
    expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'zh');
  });

  it('切换语言时调用 i18n 切换并更新 store', async () => {
    const store = useAppConfigStore();
    store.language = 'zh';
    render(LanguageSetting);

    await fireEvent.click(screen.getByTestId('toggle-language'));

    await waitFor(() => {
      expect(changeAppLanguage).toHaveBeenCalledWith('en');
      expect(store.language).toBe('en');
      expect(localStorage.getItem('multi-chat-language')).toBe('en');
    });
  });

  it('选择相同语言时不重复触发切换', async () => {
    const store = useAppConfigStore();
    store.language = 'en';
    render(LanguageSetting);

    // toggle 模拟切换到 en，与当前语言相同 → 忽略
    await fireEvent.click(screen.getByTestId('toggle-language'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(changeAppLanguage).not.toHaveBeenCalled();
  });

  it('className 透传到容器', () => {
    render(LanguageSetting, { props: { class: 'custom-class' } });

    expect(screen.getByTestId('language-setting').className).toContain('custom-class');
  });
});
