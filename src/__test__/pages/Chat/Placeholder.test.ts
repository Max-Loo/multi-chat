/**
 * Placeholder 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/Placeholder.test.tsx，保留核心语义：
 * - 移动端渲染菜单按钮和新建聊天按钮，点击菜单切换抽屉
 * - 桌面端不渲染操作按钮
 * - 占位文本渲染
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  /** 可变的响应式 mock（Ref 形状，与真实 useResponsive 一致） */
  responsive: globalThis.__createResponsiveMock(),
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

const mockNavigateToChat = vi.fn();
vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
    clearChatIdParam: vi.fn(),
  }),
}));

import Placeholder from '@/pages/Chat/components/Placeholder/Placeholder.vue';
import { createAppPinia } from '@/stores';
import { useChatPageStore } from '@/stores';

/** 渲染 Placeholder（独立 pinia） */
function renderPlaceholder() {
  const pinia = createAppPinia();
  const result = render(Placeholder, { global: { plugins: [pinia] } });
  return { ...result, pinia };
}

describe('Placeholder（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  it('应该渲染占位提示文本', () => {
    renderPlaceholder();

    expect(screen.getByText('选择聊天开聊！')).toBeInTheDocument();
  });

  describe('移动端渲染', () => {
    beforeEach(() => {
      mocks.responsive.__set({ isMobile: true });
    });

    it('应该在移动端渲染菜单按钮和新建聊天按钮', () => {
      renderPlaceholder();

      expect(screen.getByLabelText('打开聊天列表')).toBeInTheDocument();
      expect(screen.getByLabelText('新建聊天')).toBeInTheDocument();
    });

    it('应该在点击菜单按钮时切换抽屉状态', async () => {
      const { pinia } = renderPlaceholder();
      const chatPageStore = useChatPageStore(pinia);
      expect(chatPageStore.isDrawerOpen).toBe(false);

      await fireEvent.click(screen.getByLabelText('打开聊天列表'));

      expect(chatPageStore.isDrawerOpen).toBe(true);
    });

    it('应该在连续点击菜单按钮时切换 isDrawerOpen 状态', async () => {
      const { pinia } = renderPlaceholder();
      const chatPageStore = useChatPageStore(pinia);

      await fireEvent.click(screen.getByLabelText('打开聊天列表'));
      await fireEvent.click(screen.getByLabelText('打开聊天列表'));

      expect(chatPageStore.isDrawerOpen).toBe(false);
    });

    it('应该在点击新建聊天按钮时触发创建', async () => {
      renderPlaceholder();

      await fireEvent.click(screen.getByLabelText('新建聊天'));

      expect(mockNavigateToChat).toHaveBeenCalled();
    });
  });

  describe('桌面端渲染', () => {
    it('应该在桌面端不渲染操作按钮', () => {
      renderPlaceholder();

      expect(
        screen.queryByLabelText('打开聊天列表'),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText('新建聊天')).not.toBeInTheDocument();
    });
  });
});
