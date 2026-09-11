/**
 * useTranslation 响应式 i18n 绑定测试
 *
 * 通过受控的 i18next mock 验证：
 * 1. 初始渲染使用当前语言，订阅只注册一次（模块级幂等）
 * 2. languageChanged 事件后已挂载组件即时重渲染（无需刷新/重挂载）
 */
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { render, screen } from '@testing-library/vue';

// 语言状态与事件处理器的单一来源（hoisted 供 mock 工厂与测试共享）
const { mockOn, setLanguage, languageState } = vi.hoisted(() => {
  const handlers = new Set<(lng: string) => void>();
  const languageState = { current: 'en' };
  return {
    mockOn: vi.fn((event: string, handler: (lng: string) => void) => {
      if (event === 'languageChanged') handlers.add(handler);
    }),
    setLanguage: (lng: string) => {
      languageState.current = lng;
      handlers.forEach((handler) => handler(lng));
    },
    languageState,
  };
});

vi.mock('i18next', () => ({
  default: {
    get language() {
      return languageState.current;
    },
    t: vi.fn((key: string) => `${languageState.current}:${key}`),
    on: mockOn,
  },
}));

// eslint-disable-next-line import/first
import { useTranslation } from '@/composables/useTranslation';

const Harness = {
  setup() {
    const { t } = useTranslation();
    return { t };
  },
  template: `<span data-testid="greeting">{{ t('common.greeting') }}</span>`,
};

describe('useTranslation 响应式绑定', () => {
  it('初始渲染使用当前语言，languageChanged 后即时更新且订阅幂等', async () => {
    const { rerender } = render(Harness);

    // 初始：当前语言 en，事件订阅只注册一次
    expect(screen.getByTestId('greeting')).toHaveTextContent('en:common.greeting');
    expect(mockOn).toHaveBeenCalledTimes(1);

    // 同一组件上再挂载一个实例，订阅不重复注册
    render(Harness);
    expect(mockOn).toHaveBeenCalledTimes(1);

    // 模拟语言切换：事件驱动已挂载组件即时更新（无需重新挂载）
    setLanguage('zh');
    await nextTick();
    expect(screen.getAllByTestId('greeting')[0]).toHaveTextContent('zh:common.greeting');

    // 重渲染后仍保持新语言
    rerender({});
    await nextTick();
    expect(screen.getAllByTestId('greeting')[0]).toHaveTextContent('zh:common.greeting');
  });
});
