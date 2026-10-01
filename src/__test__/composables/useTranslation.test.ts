/**
 * useTranslation 组合式函数测试
 *
 * 核心验收场景（对应 vue3-app-foundation spec「语言切换即时生效」）：
 * 语言切换后无需刷新页面，已渲染组件的文案立即更新。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h } from 'vue';
import i18next from 'i18next';
import { render, screen } from '@testing-library/vue';
import { useTranslation } from '@/composables/useTranslation';

/** 测试组件：使用 useTranslation 渲染文案与语言标签 */
const TestComponent = defineComponent({
  setup() {
    const { t, language } = useTranslation();
    return () =>
      h('div', [
        h('p', { 'data-testid': 'greeting' }, t('greeting')),
        h('p', { 'data-testid': 'lang' }, language.value),
      ]);
  },
});

describe('useTranslation', () => {
  beforeEach(async () => {
    // 重新初始化真实的 i18next 实例（含中英双语资源）
    await i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: { translation: { greeting: 'Hello' } },
        zh: { translation: { greeting: '你好' } },
      },
      interpolation: { escapeValue: false },
    });
  });

  it('应渲染当前语言的翻译文案', () => {
    render(TestComponent);

    expect(screen.getByTestId('greeting').textContent).toBe('Hello');
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('语言切换后已渲染组件应立即更新（无需刷新）', async () => {
    render(TestComponent);

    expect(screen.getByTestId('greeting').textContent).toBe('Hello');

    // 切换语言（等价于设置页调用 changeAppLanguage 的底层行为）
    await i18next.changeLanguage('zh');

    // 响应式更新：组件文案立即变为新语言
    expect(screen.getByTestId('greeting').textContent).toBe('你好');
  });

  it('翻译函数应支持插值参数', async () => {
    await i18next.addResourceBundle('en', 'translation', {
      welcome: 'Welcome, {{name}}',
    });

    const ParamComponent = defineComponent({
      setup() {
        const { t } = useTranslation();
        return () => h('p', { 'data-testid': 'welcome' }, t('welcome', { name: 'Vue' }));
      },
    });

    render(ParamComponent);

    expect(screen.getByTestId('welcome').textContent).toBe('Welcome, Vue');
  });

  it('组件卸载后应移除 languageChanged 监听', async () => {
    const { unmount } = render(TestComponent);

    const offSpy = vi.spyOn(i18next, 'off');

    unmount();

    // 卸载后监听器被清理（onScopeDispose 生效）
    expect(offSpy).toHaveBeenCalledWith('languageChanged', expect.any(Function));
    offSpy.mockRestore();
  });

  it('语言切换事件应驱动 language ref 更新', async () => {
    render(TestComponent);

    expect(screen.getByTestId('lang').textContent).toBe('en');

    await i18next.changeLanguage('zh');

    expect(screen.getByTestId('lang').textContent).toBe('zh');
  });
});
