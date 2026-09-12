/**
 * Vue 通用组件补充测试
 *
 * 覆盖阶段 3 迁移组件的关键交互分支：
 * - ThinkingSection：折叠/展开、加载态图标切换
 * - BottomNav：移动端渲染、导航点击、激活态
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { render, screen, fireEvent } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';

// Mock vue-router（BottomNav 依赖）
const mockPush = vi.fn().mockResolvedValue(undefined);
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ path: '/chat' }),
}));

// Mock 响应式（强制移动端模式）
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => ({ isMobile: ref(true) }),
}));

// Mock i18n 绑定（完整键查表；选择器函数用翻译表求值）
vi.mock('@/composables/useTranslation', () => ({
  useTranslation: () => {
    const table: Record<string, unknown> = {
      navigation: { chat: '聊天', model: '模型', setting: '设置' },
      common: { a11y: { bottomNav: '底部导航' } },
    };
    const lookup = (key: string): string =>
      key.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], table) as string;
    return {
      t: ((key: string | ((r: Record<string, unknown>) => string)) => {
        if (typeof key === 'string') return lookup(key);
        return key(table) as string;
      }) as never,
    };
  },
}));

import ThinkingSection from '@/components/chat/ThinkingSection.vue';
import BottomNav from '@/components/BottomNav.vue';

describe('ThinkingSection（Vue 版）', () => {
  it('默认折叠：显示右箭头，不渲染内容', () => {
    render(ThinkingSection, {
      props: { title: '深度思考', content: '推理过程' },
    });

    expect(screen.getByText('深度思考')).toBeDefined();
    expect(screen.getByTestId('chevron-right')).toBeDefined();
    expect(screen.queryByText('推理过程')).toBeNull();
    expect(screen.queryByTestId('thinking-loading')).toBeNull();
  });

  it('点击标题切换展开/折叠，展开时渲染推理内容', async () => {
    render(ThinkingSection, {
      props: { title: '深度思考', content: '推理过程' },
    });

    await fireEvent.click(screen.getByText('深度思考'));

    expect(screen.getByTestId('chevron-down')).toBeDefined();
    expect(screen.getByText('推理过程')).toBeDefined();

    await fireEvent.click(screen.getByText('深度思考'));
    expect(screen.queryByText('推理过程')).toBeNull();
  });

  it('initiallyExpanded 为 true 时初始展开', () => {
    render(ThinkingSection, {
      props: { title: '深度思考', content: '推理过程', initiallyExpanded: true },
    });

    expect(screen.getByText('推理过程')).toBeDefined();
  });

  it('加载态标题带 loading 标记', () => {
    render(ThinkingSection, {
      props: { title: '思考中', content: '', loading: true },
    });

    expect(screen.getByTestId('thinking-loading')).toBeDefined();
  });
});

describe('BottomNav（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('移动端模式渲染全部导航项', () => {
    render(BottomNav);

    expect(screen.getByText('聊天')).toBeDefined();
    expect(screen.getByText('模型')).toBeDefined();
    expect(screen.getByText('设置')).toBeDefined();
  });

  it('点击导航项应跳转对应路由', async () => {
    render(BottomNav);

    fireEvent.click(screen.getByText('设置'));

    expect(mockPush).toHaveBeenCalledWith('/setting');
  });
});
